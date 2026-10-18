# Guía de Arquitectura: Python + FastAPI (Producción)

Este documento establece los estándares, lineamientos de diseño y directrices técnicas de nivel de producción para el desarrollo del backend utilizando **Python 3.11+**, **FastAPI** y **SQLModel + SQLAlchemy 2.0**.

---

## 1. Filosofía Arquitectónica y Principios de Diseño

El backend se rige bajo los principios de **Clean Architecture** (Arquitectura Limpia) adaptados a la modularidad y velocidad de FastAPI. El objetivo principal es mantener el núcleo del negocio (modelos matemáticos, reglas de fraude y procesos de compras) aislado de tecnologías externas (framework web, bases de datos y clientes HTTP).

```
 ┌─────────────────────────────────────────────────────────────┐
 │ Presentation Layer (API Routers, Middleware, FastAPI Entry) │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (Inyecta dependencias)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  Services/Use Cases Layer (ML Engines, Business Services)   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (Utiliza contratos/esquemas)
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │   Infrastructure Layer (SQLModel sessions, DGCP client)     │
  └──────────────────────────────┬──────────────────────────────┘
                                │ (Persistencia / Entrada)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │       Domain Layer (Pydantic schemas, Pure Rules, Types)    │
 └─────────────────────────────┘
```

### Principios Fundamentales
*   **Separación de Responsabilidades (SoC):** Cada módulo contiene sus rutas, lógica de servicios y validaciones. La infraestructura se separa a nivel de directorio.
*   **Aislamiento del Dominio:** Los modelos matemáticos (Isolation Forest) e índices (Indice Herfindahl-Hirschman) se computan usando estructuras puras de datos en el dominio. No dependen de llamadas a base de datos dentro de sus algoritmos.
*   **Inmutabilidad y Auditoría:** Los registros de auditoría y transacciones resueltas se escriben bajo un modelo "Append-Only" (solo inserciones), garantizando trazabilidad total.
*   **Validación Estricta:** Todas las entradas y salidas de la API pasan por esquemas de validación de Pydantic v2 en el extremo del sistema.
*   **Tipado Estricto (PEP 484):** Todo método debe declarar tipos para sus argumentos y retornos. No se permite el tipo implícito `Any` sin justificación explícita.

---

## 2. Pila Tecnológica Detallada (Tech Stack)

### Backend Core

| Componente | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Runtime** | Python | `3.11+` | Mejoras en velocidad, sintaxis moderna de tipos y optimización asíncrona de `asyncio`. |
| **Framework** | FastAPI | `^0.110.0` | Alto rendimiento en peticiones concurrentes, tipado nativo y generación automática de OpenAPI en base a Pydantic. |
| **Servidor ASGI** | Uvicorn | `^0.28.0` | Servidor rápido de ASGI basado en uvloop para procesar bucles de eventos no bloqueantes. |
| **ORM / DB Layer**| SQLModel | `^0.0.22` | Combina Pydantic con SQLAlchemy 2.0. Permite usar un solo modelo para esquema de API y persistencia asíncrona. |
| **Validación** | Pydantic v2 | `^2.6.4` | Motor escrito en Rust que procesa validaciones hasta 20 veces más rápido que la versión 1.x. |
| **Configurador** | Pydantic Settings| `^2.2.1` | Manejo y parseo estricto de variables de entorno al iniciar la app. |
| **Seguridad** | PyJWT | `^2.9.0` | Creación, firma y verificación de JSON Web Tokens (JWT) seguros para sesiones. |
| **Cifrado** | bcrypt | `^4.2.0` | Hashing seguro directo de contraseñas locales en SQLite/PostgreSQL sin dependencias obsoletas. |

### Procesamiento de Datos e Inteligencia Artificial (ML/AI)

| Componente | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Cálculo Numérico** | NumPy & Pandas | `^2.0.0` / `^2.2.0` | Manipulación de vectores de precios unitarios e ingestión masiva de la API DGCP. |
| **Aprendizaje ML** | scikit-learn | `^1.4.1` | Algoritmo Isolation Forest para la clasificación no supervisada de anomalías de mercado. |
| **Estructuras de Red** | NetworkX | `^3.2.1` | Modelado y análisis de grafos para la identificación de anillos de colusión entre proveedores. |
| **Fuzzy Matching** | python-Levenshtein| `^0.25.0` | Comparativa rápida por distancia de edición sobre cadenas de nombres y direcciones físicas. |
| **Explicabilidad** | SHAP | `^0.45.0` | Atribución de características para desglosar el veredicto de la IA a los auditores gubernamentales. |

---

## 3. Estructura de Directorios del Monorepo Backend

El backend se organiza de forma que las dependencias fluyan hacia adentro. Los routers de la presentación llaman a los servicios, los servicios llaman a la infraestructura y todos comparten los modelos de dominio.

```text
backend-app/
│
├── src/
│   ├── models/               # Clases de SQLModel (API + Tablas físicas relacionales)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── contracts.py
│   │   ├── suppliers.py
│   │   └── anomalies.py
│   │
│   ├── domain/               # Entidades lógicas puras y reglas del negocio
│   │   ├── __init__.py
│   │   ├── types.py          # Envolturas de API y definiciones comunes
│   │   └── rules.py          # Algoritmos de cálculo de red flags (fraccionamiento, etc.)
│   │
│   ├── services/             # Orquestadores de procesos y lógica de aplicación
│   │   ├── __init__.py
│   │   ├── auth_service.py   # Registro, login y validación de tokens
│   │   ├── sync_service.py   # Ingestión asíncrona de datos DGCP
│   │   ├── anomaly_service.py# Isolation Forest, SHAP e IHH
│   │   └── network_service.py# Construcción de redes de colusión relacional
│   │
│   ├── infrastructure/       # Conectores y llamadas externas (DB, HTTP Clients)
│   │   ├── __init__.py
│   │   ├── database.py       # Configuración del motor asíncrono y sesión de SQLModel/SQLAlchemy
│   │   ├── repository.py     # Patrón repositorio para abstracción de consultas
│   │   └── dgcp_client.py    # Cliente HTTP asíncrono para la API de la DGCP
│   │
│   ├── presentation/         # Protocolos de transporte (FastAPI Routers)
│   │   ├── __init__.py
│   │   ├── main.py           # Inicialización y Lifespan de la app
│   │   ├── routers/          # Controladores modulares expuestos
│   │   │   ├── auth.py
│   │   │   ├── contracts.py
│   │   │   └── anomalies.py
│   │   ├── middleware/       # Interceptores (CORS, logs, excepciones)
│   │   │   ├── exceptions.py
│   │   │   └── logging.py
│   │   └── dependencies.py   # Funciones inyectoras para FastAPI Depends (db session, etc.)
│   │
│   ├── migrations/           # Historial de versiones de base de datos generado por Alembic
│   ├── config.py             # Clase Pydantic Settings para configuración
│   └── utils/                # Utilidades comunes (cifrado, fechas)
│       └── security.py
│
├── tests/                    # Banco de pruebas (Pytest)
│   ├── __init__.py
│   ├── conftest.py           # Fixtures asíncronas y mocks
│   ├── unit/                 # Pruebas unitarias de servicios y reglas
│   │   ├── test_rules.py
│   │   └── test_ml_anomalies.py
│   └── integration/          # Pruebas de integración de la API
│       ├── test_auth_flow.py
│       └── test_endpoints.py
│
├── pyproject.toml            # Configuración de dependencias de Poetry y Ruff
├── poetry.lock               # Archivo de bloqueo de versiones exactas
└── README.md                 # Documentación de instalación local
```

---

## 4. Estándar de Configuración Global (`pyproject.toml`)

Administramos las dependencias de Python y configuramos las herramientas de análisis estático dentro del archivo unificado `pyproject.toml`.

```toml
[tool.poetry]
name = "veedoria-backend"
version = "0.1.0"
description = "Backend analítico para el monitoreo de contrataciones públicas de la República Dominicana"
authors = ["Jerermy Michel Solano Frías <jsjer@unapec.edu.do>"]
readme = "README.md"
packages = [{include = "src"}]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
uvicorn = {extras = ["standard"], version = "^0.28.0"}
pydantic = "^2.6.4"
pydantic-settings = "^2.2.1"
sqlmodel = "^0.0.22"
alembic = "^1.13.0"
scikit-learn = "^1.4.1"
numpy = "^2.0.0"
pandas = "^2.2.0"
networkx = "^3.2.1"
python-levenshtein = "^0.25.0"
shap = "^0.45.0"
pyjwt = "^2.9.0"
bcrypt = "^4.2.0"
httpx = "^0.27.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.1.1"
pytest-asyncio = "^0.23.5"
ruff = "^0.3.2"
pytest-cov = "^4.1.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
# Habilitar reglas estandarizadas de calidad de código
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # pyflakes
    "I",     # isort (orden de imports)
    "B",     # flake8-bugbear (errores comunes)
    "C4",    # flake8-comprehensions
    "UP",    # pyupgrade (sintaxis moderna)
    "ASYNC", # flake8-async (buenas prácticas asíncronas)
    "S",     # flake8-bandit (escaneo de seguridad)
    "T20",   # flake8-print (prohibir prints)
]
ignore = [
    "S101",  # Permitir asserts en pruebas
    "S105",  # Permitir strings duros simulando tokens en mocks
]

[tool.ruff.lint.isort]
combine-as-imports = true
known-first-party = ["src"]
section-order = ["future", "standard-library", "third-party", "first-party", "local-folder"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
filterwarnings = ["ignore::DeprecationWarning"]

---

## 5. Manejo de Errores y Respuestas API

Toda respuesta de API debe seguir un formato unificado, tanto en éxito como en error. Esto permite al frontend parsear siempre la misma estructura sin importar el endpoint.

### 5.1 — Esquema de Respuesta Unificado (`ApiResponse[T]`)

```python
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    message: str = ""

class ApiErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: list[dict] = []
```

**Reglas:**
- `ApiResponse[T]` se usa para respuestas exitosas (2xx).
- `ApiErrorResponse` se usa para respuestas de error (4xx/5xx).
- El campo `error` es un mensaje legible para el frontend.
- El campo `details` contiene errores de validación por campo (ej. de Pydantic 422).

### 5.2 — Jerarquía de Excepciones (`AppError`)

```python
class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: list[dict] | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)

class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message, status_code=404)

class AuthenticationError(AppError):
    def __init__(self, message: str = "Credenciales incorrectas"):
        super().__init__(message, status_code=401)

class AuthorizationError(AppError):
    def __init__(self, message: str = "No autorizado para realizar esta accion"):
        super().__init__(message, status_code=403)
```

**Uso en servicios:** Lanza `AppError` desde la capa de servicios. El handler global lo captura y retorna `ApiErrorResponse`.

### 5.3 — Global Exception Handler

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

# Capturar AppError controlados
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiErrorResponse(
            success=False,
            error=exc.message,
            details=exc.details
        ).model_dump()
    )

# Capturar errores inesperados (500)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")  # Siempre loggear el stack trace
    return JSONResponse(
        status_code=500,
        content=ApiErrorResponse(
            success=False,
            error="Error interno del servidor",
            details=[]
        ).model_dump()
    )
```

**Reglas:**
- Los `AppError` controlados retornan códigos específicos (400, 401, 403, 404).
- Las excepciones NO controladas (`Exception`) retornan 500 genérico sin exponer detalles internos.
- Siempre loggear `logger.exception()` antes de retornar 500 para tener trazabilidad.

### 5.4 — Mapeo de Errores de Validación Pydantic (422)

FastAPI retorna errores 422 en un formato diferente. Debes registrar un handler para unificarlo:

```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [
        {"field": err["loc"][-1], "issue": err["msg"], "type": err["type"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=ApiErrorResponse(
            success=False,
            error="Error de validacion",
            details=details
        ).model_dump()
    )
```

---

## 6. Tareas Asíncronas, Background Tasks y Job Tracking

FastAPI permite ejecutar tareas después de enviar la respuesta HTTP. Este patrón es útil para ingestiones de datos, notificaciones y logs de auditoría.

### 6.1 — Uso de `BackgroundTasks`

```python
from fastapi import BackgroundTasks, APIRouter

router = APIRouter()

@router.post("/sync-data", status_code=202)
async def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(safe_sync_task)
    return {"message": "Sincronizacion iniciada"}
```

**Advertencia:** `BackgroundTasks` **silencia errores**. Si la tarea lanza una excepción, esta se pierde sin log ni notificación. Nunca pases una tarea cruda — usa siempre un wrapper seguro.

### 6.2 — Safe Wrapper para Background Tasks

```python
import asyncio
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
        logger.info("Task %s completed", task_id)
    except Exception as e:
        logger.exception("Task %s failed: %s", task_id, e)
        await update_job_status(session, task_id, "failed", started_at, str(e))
        raise  # Opcional: re-lanzar si hay un handler global

# En el router:
background_tasks.add_task(safe_background_task, task_id=123, session=session)
```

**Reglas:**
- Siempre envolver background tasks con un `try/except` que loggee el error.
- Registrar el estado inicial antes de ejecutar y actualizar al finalizar.
- Usar `logger.exception()` para capturar el stack trace completo.

### 6.3 — Persistent Job Tracking Model

```python
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class JobLog(SQLModel, table=True):
    """Registro genérico de ejecución de tareas. Renombrar según dominio (SyncLog, ETLLog...)."""
    __tablename__ = "job_log"

    id: int | None = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    records_processed: int = 0
    status: str = Field(default="running")  # running | completed | partial | failed
    error_message: str | None = None
    triggered_by: str = Field(default="unknown")  # cli | api | cron
```

**Uso:**
- Crear un `JobLog` al iniciar la tarea.
- Actualizar `status` y `completed_at` al finalizar.
- Si falla, guardar `error_message` y marcar `failed`.

### 6.4 — Retry con Exponential Backoff

Para operaciones que llaman APIs externas (ej. DGCP, cualquier API HTTP pública):

```python
import asyncio
import httpx

async def fetch_with_retry(client: httpx.AsyncClient, url: str, max_retries: int = 3) -> dict:
    """GET con retry exponencial. Retry solo en 5xx, timeouts y errores de red."""
    for attempt in range(max_retries):
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500 and attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning("Retry %d/%d after %ds: %s", attempt + 1, max_retries, wait, e)
                await asyncio.sleep(wait)
            else:
                raise  # 4xx no se retry, 5xx final también falla
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning("Retry %d/%d after %ds: %s", attempt + 1, max_retries, wait, e)
                await asyncio.sleep(wait)
            else:
                raise
```

**Reglas de retry:**
| Código | ¿Retry? | Razón |
|---|---|---|
| 2xx | ✅ Éxito | Continuar |
| 4xx (400, 401, 403, 404, 422) | ❌ No | Error del cliente, no del servidor |
| 5xx (500, 502, 503, 504) | ✅ Sí | Error transitorio del servidor |
| Timeout / NetworkError | ✅ Sí | Error de red transitorio |

**Parámetros recomendados:**
- `max_retries`: 3 (mínimo), 5 (máximo)
- `backoff`: `2^attempt` segundos (1s, 2s, 4s, 8s...)
- `jitter`: Opcional, agregar ±random(0, 1) segundo para evitar thundering herd

---

## 7. Logging y Observabilidad

### 7.1 — Convención de Named Loggers

```python
import logging

# Nombre: <app>.<layer>.<component>
logger = logging.getLogger("app.services.sync_service")
logger = logging.getLogger("app.infrastructure.dgcp_client")
logger = logging.getLogger("app.presentation.main")
logger = logging.getLogger("app.infrastructure.database")
```

Patrón: `app.` seguido del módulo (capa) y el archivo (componente).

### 7.2 — Guía de Niveles de Log

| Nivel | Cuándo usarlo | Ejemplo |
|---|---|---|
| `DEBUG` | Desarrollo, diagnóstico interno | "Parsing release OCDS-123" |
| `INFO` | Eventos de negocio importantes | "Sync completed: 15000 records" |
| `WARNING` | Problemas no críticos que no detienen el flujo | "Rate limit approaching, slowing down" |
| `ERROR` | Fallos que requieren atención | "DGCP API returned 503" |
| `CRITICAL` | Fallos catastróficos que detienen la app | "Database connection failed at startup" |

### 7.3 — Configuración en `main.py`

```python
import logging
from src.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("app")
```

Variable de entorno requerida: `LOG_LEVEL` (default `INFO`).

### 7.4 — Qué Loggear (y qué NO)

**Sí loggear:**
- Ciclo de vida de la app (inicio, shutdown)
- Ejecución de tareas batch (inicio, progreso, fin, errores)
- Excepciones no esperadas (con stack trace completo)
- Eventos de autenticación (login exitoso, fallido)
- Cambios de estado de entidades críticas

**NO loggear:**
- Contraseñas, tokens JWT, API keys
- Datos personales (nombres completos, emails en logs)
- Body completo de requests (riesgo de exponer datos sensibles)
- Información de depuración en producción (usar DEBUG local)

---

## 8. Seguridad

Ver la guía específica en:
- [architecture-part06-security-hardening-cors-to-jwt-auth.md](./architecture-part06-security-hardening-cors-to-jwt-auth.md)

### Resumen de principios:

| Principio | Implementación |
|---|---|
| **Passwords** | Hash directo con `bcrypt` (costo 12), sin `passlib` |
| **JWT** | `PyJWT` con HMAC-SHA256, access token 15 min, refresh token 7 días |
| **CORS** | Permitir solo orígenes conocidos (VITE_FRONTEND_URL) en producción |
| **Roles** | `RoleChecker` dependencia para RBAC: ADMIN, AUDITOR, BIDDER, CITIZEN |
| **Auditoría** | Modelo `AuditLog` con append-only, registrando acción, entidad, antes/después |
