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
