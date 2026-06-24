### 1. Estructura de Controladores (`APIRouter`)

FastAPI maneja el enrutamiento a través de instancias de `APIRouter`. Cada router representa un dominio o módulo específico del sistema, manteniendo las firmas de los métodos limpias y acotadas.

---

### 2. Definición del Router de Anomalías (`src/presentation/routers/anomalies.py`)

Todos los parámetros de consulta y ruta deben estar explícitamente tipados. Utilizamos anotaciones de FastAPI como `Path` y `Query` para añadir metadatos y validaciones de rango numérico directamente en la definición del endpoint.

```python
# src/presentation/routers/anomalies.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, Query, Path, status
from src.domain.types import ApiResponse
from src.models.anomalies import AnomalyCard, MarkReviewedPayload
from src.services.anomaly_service import AnomalyService
from src.presentation.dependencies import get_anomaly_service

router = APIRouter()

@router.get(
    "/unresolved",
    response_model=ApiResponse[List[AnomalyCard]],
    status_code=status.HTTP_200_OK,
    summary="Obtiene las anomalías sin resolver",
    description="Retorna una lista paginada de procesos con puntajes altos de sospecha por el Isolation Forest."
)
async def get_unresolved(
    service: Annotated[AnomalyService, Depends(get_anomaly_service)],
    limit: Annotated[int, Query(ge=1, le=100, description="Cantidad de registros a obtener")] = 20,
    min_score: Annotated[float, Query(ge=-1.0, le=1.0, description="Puntaje de anomalía mínimo")] = 0.5
):
    # La inyección inyecta de forma segura el 'service'
    cases = await service.fetch_unresolved_anomalies(limit=limit, min_score=min_score)
    return ApiResponse(data=cases)

@router.post(
    "/{anomaly_id}/resolve",
    response_model=ApiResponse[bool],
    status_code=status.HTTP_200_OK,
    summary="Resuelve un caso de bandera roja"
)
async def resolve_case(
    anomaly_id: Annotated[str, Path(description="UUID de la anomalía a resolver")],
    payload: MarkReviewedPayload,
    service: Annotated[AnomalyService, Depends(get_anomaly_service)]
):
    success = await service.resolve_anomaly_case(
        anomaly_id=anomaly_id,
        reviewer=payload.reviewed_by,
        notes=payload.audit_notes
    )
    return ApiResponse(data=success, message="Alerta resuelta con éxito.")
```

---

### 3. Inyección de Dependencias Reutilizables (`src/presentation/dependencies.py`)

Aislamos la creación de instancias de base de datos y servicios en funciones inyectoras. Esto nos permite simular dependencias de forma sencilla en entornos de testing modificando la propiedad `dependency_overrides` de FastAPI.

```python
# src/presentation/dependencies.py
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.database import get_db
from src.services.anomaly_service import AnomalyService

def get_anomaly_service(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> AnomalyService:
    """Inyector que inicializa el servicio de ML de anomalías pasándole la sesión de base de datos."""
    return AnomalyService(db=db)
```
