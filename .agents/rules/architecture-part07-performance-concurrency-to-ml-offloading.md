### 1. Gestión de Bloqueos en Entornos Asíncronos

FastAPI opera sobre un bucle de eventos monohilo (`asyncio`). Esto significa que:
*   **Tareas I/O-Bound** (consultas de base de datos SQLModel o descargas de la API de la DGCP) no consumen CPU y deben declararse con `async def` utilizando `await` para que la CPU pueda procesar otras solicitudes mientras se esperan los datos.
*   **Tareas CPU-Bound** (computar matrices de precios de scikit-learn, fuzzy matching recursivo o grafos NetworkX) consumen el 100% de un núcleo de CPU. Si se ejecutan directamente dentro de una función asíncrona, el event loop se congela por completo y la API deja de responder solicitudes concurrentes.

---

### 2. Ejecución Paralela mediante Pools de Procesos (`ProcessPoolExecutor`)

Para prevenir bloqueos del event loop durante el entrenamiento de Isolation Forest, delegamos los cálculos a núcleos de CPU separados utilizando la clase `ProcessPoolExecutor`.

```python
# src/services/anomaly_service.py
import asyncio
from concurrent.futures import ProcessPoolExecutor
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.models.contracts import Item
from sklearn.ensemble import IsolationForest
import numpy as np

# Instancia global del pool de procesos (evita instanciar uno por petición)
ml_executor = ProcessPoolExecutor(max_workers=2)

def compute_isolation_forest_scores(unit_prices: List[float]) -> List[float]:
    """Cálculo numérico pesado ejecutado en un proceso del pool de CPU independiente."""
    # Convertimos los datos de entrada a matrices de dos dimensiones
    X = np.array(unit_prices).reshape(-1, 1)
    
    # Instanciamos y entrenamos el estimador Isolation Forest
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    # Retornamos el puntaje de anomalía (-1.0 es altamente anómalo, 1.0 es normal)
    scores = model.decision_function(X)
    return scores.tolist()

class AnomalyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_ml_analysis(self, unspsc_code: str) -> List[float]:
        """Obtiene precios de la base de datos y ejecuta la predicción sin bloquear la API."""
        # 1. Recuperar ítems de la base de datos (Operación I/O asíncrona)
        statement = select(Item).where(Item.unspsc_code == unspsc_code)
        result = await self.db.execute(statement)
        items = result.scalars().all()
        
        if len(items) < 10:
            # Muy pocos datos históricos para entrenar
            return []
            
        prices = [item.unit_price for item in items]
        
        # 2. Delegar la carga computacional de ML a un proceso secundario (Operación asíncrona no bloqueante)
        loop = asyncio.get_running_loop()
        scores = await loop.run_in_executor(
            ml_executor,
            compute_isolation_forest_scores,
            prices
        )
        return scores
```

---

### 3. Tareas en Segundo Plano (`BackgroundTasks`)

FastAPI provee la clase `BackgroundTasks` para ejecutar rutinas livianas después de enviar la respuesta HTTP al cliente (ej. escribir logs de auditoría o disparar notificaciones de alertas nuevas), evitando demoras en el tiempo de respuesta visual percibido por el usuario.

```python
# Ejemplo de uso en routers para la sincronización con la API DGCP
from fastapi import APIRouter, BackgroundTasks, status
from src.services.sync_service import sync_contracts_task

router = APIRouter()

@router.post("/sync-dgcp", status_code=status.HTTP_202_ACCEPTED)
async def trigger_etl_sync(background_tasks: BackgroundTasks):
    """Acepta la petición inmediatamente y ejecuta la descarga en segundo plano."""
    background_tasks.add_task(sync_contracts_task)
    return {"message": "Proceso de descarga y sincronización de datos DGCP iniciado."}
```

---

### 4. Manejo de Errores en Tareas en Segundo Plano

Las tareas de `BackgroundTasks` se ejecutan sin supervisión: si lanzan una excepción, FastAPI la traga silenciosamente sin loguearla ni notificarla. **Nunca se debe pasar una función cruda** a `add_task()` — siempre usar un wrapper que capture errores.

#### Patrón: Safe Wrapper para BackgroundTasks

```python
import logging
from datetime import datetime, timezone

logger = logging.getLogger("app.background")

async def safe_background_task(task_id: int, session):
    """Wrapper que captura y loggea errores, actualizando el estado persistente."""
    started_at = datetime.now(timezone.utc)
    try:
        logger.info("Task %s started", task_id)
        await run_actual_task(session)
        await update_job_status(session, task_id, "completed", started_at)
        logger.info("Task %s completed successfully", task_id)
    except Exception as e:
        logger.exception("Task %s failed: %s", task_id, e)
        await update_job_status(session, task_id, "failed", started_at, str(e))
        # No re-lanzar: BackgroundTask no tiene handler, el error se perdería igual
```

#### Patrón: JobLog Tracking Array/Batch con Commit Parcial

Si la tarea procesa datos en batches (ej. páginas de una API externa), cada batch debe tener su propio `try/except` para que un fallo parcial no descarte todo el progreso:

```python
async def batch_sync(session):
    page = 1
    total = 0
    errors = []
    while True:
        try:
            data = await fetch_page(page)
            if not data:
                break
            await upsert_batch(data, session)
            total += len(data)
            await session.commit()
            logger.info("Page %d: %d records", page, len(data))
            page += 1
        except Exception as e:
            logger.exception("Page %d failed: %s", page, e)
            errors.append({"page": page, "error": str(e)})
            await session.rollback()
            page += 1  # Continuar con la siguiente página
    return total, errors
```

**Reglas:**
| Situación | Acción |
|---|---|
| Batch individual falla | Loggear error, rollback del batch, continuar con siguiente |
| Error de conexión a BD | Loggear error, esperar, reintentar batch |
| Error irrecuperable (token expirado, schema changed) | Detener tarea, marcar como `failed` |
| Tareas muy largas (>30 min) | Considerar Celery/ARQ en lugar de BackgroundTasks |

---

### 5. Reintentos con Retroceso Exponencial (Exponential Backoff)

Para todas las operaciones que consumen APIs externas (DGCP, cualquier HTTP API pública), implementar retry con backoff.

```python
import asyncio
import httpx

async def fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> dict:
    """GET con retry exponencial. Solo retry en 5xx, timeouts y errores de red."""
    for attempt in range(max_retries):
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500 and attempt < max_retries - 1:
                wait = base_delay * (2 ** attempt)
                logger.warning("Retry %d/%d after %.1fs: %s", attempt + 1, max_retries, wait, e)
                await asyncio.sleep(wait)
            else:
                raise
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt < max_retries - 1:
                wait = base_delay * (2 ** attempt)
                logger.warning("Retry %d/%d after %.1fs (network): %s", attempt + 1, max_retries, wait, e)
                await asyncio.sleep(wait)
            else:
                raise
```

**Reglas de retry:**

| Condición | ¿Retry? | Estrategia |
|---|---|---|
| 2xx | ✅ Éxito | Continuar |
| 4xx (400, 401, 403, 404, 422) | ❌ No | Error de cliente, no recuperable |
| 5xx (500, 502, 503, 504) | ✅ Sí | Error transitorio de servidor |
| TimeoutException | ✅ Sí | La red puede recuperarse |
| NetworkError | ✅ Sí | La red puede recuperarse |

**Recomendaciones de configuración:**
- `max_retries`: 3 para operaciones críticas, 2 para consultas livianas
- `base_delay`: 1.0 segundo
- Backoff: `base_delay * 2^attempt` → 1s, 2s, 4s, 8s...
- Opcional: agregar `random.uniform(0, 0.5)` de jitter para evitar thundering herd

---

### 6. Seguimiento Persistente de Tareas (JobLog)

Para tareas largas o críticas (ETL, ML, sync), crear un registro en base de datos para trackear el estado de cada ejecución.

```python
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class JobLog(SQLModel, table=True):
    """Registro genérico de ejecución de tareas."""
    __tablename__ = "job_log"

    id: int | None = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    records_processed: int = 0
    status: str = Field(default="running")  # running | completed | partial | failed
    error_message: str | None = None
    triggered_by: str = Field(default="unknown")  # cli | api | cron
```

**Ciclo de vida de un JobLog:**
1. **Antes de empezar:** Crear registro con `status="running"`, `started_at=now`
2. **Durante:** Actualizar `records_processed` periódicamente si es posible
3. **Al completar:** `status="completed"`, `completed_at=now`
4. **Al fallar parcial:** `status="partial"`, `error_message="N páginas fallaron"`
5. **Al fallar totalmente:** `status="failed"`, `error_message=str(exception)`

**Consulta de último sync exitoso:**
```python
from sqlmodel import select, desc

async def get_last_sync(session) -> JobLog | None:
    stmt = (
        select(JobLog)
        .where(JobLog.status == "completed")
        .order_by(desc(JobLog.completed_at))
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
```

---

### 7. Configuración de Logging

#### 7.1 — Convención de Nombres de Logger

```python
logger = logging.getLogger("app.services.sync_service")      # Servicios
logger = logging.getLogger("app.infrastructure.dgcp_client")  # Clientes externos
logger = logging.getLogger("app.presentation.main")           # Entry point
logger = logging.getLogger("app.infrastructure.database")     # Base de datos
```

Patrón: `app.<capa>.<componente>`.

#### 7.2 — Configuración en `main.py`

```python
import logging

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),  # "INFO", "DEBUG", etc.
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("app")
```

#### 7.3 — Guía de Niveles de Log (uso práctico)

| Nivel | Cuándo | Ejemplo |
|---|---|---|
| `DEBUG` | Diagnóstico, desarrollo | `"Parsing release OCDS-123: 15 items found"` |
| `INFO` | Eventos de negocio importantes | `"Sync completed: 15000 records in 45s"` |
| `WARNING` | Problemas no críticos | `"Rate limit approaching, slowing requests"` |
| `ERROR` | Fallos que requieren atención | `"DGCP API returned 503, batch 5 failed"` |
| `CRITICAL` | Fallos catastróficos | `"Database connection failed at startup"` |

#### 7.4 — Qué NO loggear

| ❌ No loggear | Razón |
|---|---|
| Contraseñas | Exposición de credenciales |
| Tokens JWT completos | Pueden ser reutilizados |
| API keys / secrets | Exposición de acceso |
| Datos personales (nombres, emails) | Privacidad / RGPD |
| Body completo de requests | Riesgo de datos sensibles |

#### 7.5 — Logging de Errores en Background Tasks

Cuando una tarea en segundo plano falla, **siempre** usar `logger.exception()` para capturar el stack trace completo:

```python
# Bien: captura stack trace
logger.exception("Sync task failed: %s", e)

# Mal: solo el mensaje, sin contexto
logger.error("Sync task failed: %s", e)
```
