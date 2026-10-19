import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.anomaly import (
    AnomalyContext,
    AnomalyListResponse,
    AnomalyResponse,
    AnomalyReviewPayload,
    AnomalyStats,
)
from src.domain.types import ApiResponse
from src.infrastructure.dependencies import get_db
from src.models.sync_log import SyncLog
from src.presentation.dependencies import get_anomaly_service
from src.presentation.runners import run_detection
from src.services.anomaly_service import AnomalyService

logger = logging.getLogger("veedoria.presentation.routers.anomaly")
router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.post("/detect", status_code=202)
async def detect_anomalies(session: AsyncSession = Depends(get_db)) -> ApiResponse:
    stmt = select(SyncLog).where(
        SyncLog.status == "running",
        SyncLog.process_type == "detection",
    )
    result = await session.execute(stmt)
    if result.scalars().first():
        return ApiResponse(success=False, message="La detección de anomalías ya está en progreso")

    try:
        tag = await run_detection()
    except RuntimeError as e:
        return ApiResponse(success=False, message=str(e))
    return ApiResponse(success=True, data={"task": tag}, message="Detección de anomalías iniciada en segundo plano.")


@router.get("", response_model=ApiResponse[AnomalyListResponse])
async def list_anomalies(
    service: AnomalyService = Depends(get_anomaly_service),
    anomaly_type: str | None = Query(None, description="Filtrar por tipo (PRICE_ANOMALY, FRAGMENTATION, COLLUSION)"),
    status: str | None = Query(None, description="Filtrar por estado (PENDING, CONFIRMED, DISMISSED)"),
    min_severity: float | None = Query(None, ge=0.0, le=1.0, description="Severidad mínima"),
    search: str | None = Query(None, description="Búsqueda textual por proceso, contrato, proveedor, institución o descripción"),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
) -> ApiResponse[AnomalyListResponse]:
    offset = (page - 1) * limit
    items, total = await service.get_anomalies(
        anomaly_type=anomaly_type,
        status=status,
        min_severity=min_severity,
        search=search,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        data=AnomalyListResponse(
            items=[AnomalyResponse.model_validate(a, from_attributes=True) for a in items],
            total=total,
            page=page,
            limit=limit,
        )
    )


@router.get("/stats", response_model=ApiResponse[AnomalyStats])
async def get_stats(
    service: AnomalyService = Depends(get_anomaly_service),
) -> ApiResponse[AnomalyStats]:
    stats = await service.get_anomaly_stats()
    return ApiResponse(data=AnomalyStats(**stats))


@router.get("/{anomaly_id}", response_model=ApiResponse[AnomalyResponse])
async def get_anomaly(
    anomaly_id: str,
    service: AnomalyService = Depends(get_anomaly_service),
) -> ApiResponse[AnomalyResponse]:
    anomaly = await service.get_anomaly(anomaly_id)
    if not anomaly:
        return ApiResponse(success=False, message="Anomalía no encontrada")
    return ApiResponse(data=AnomalyResponse.model_validate(anomaly, from_attributes=True))


@router.get("/{anomaly_id}/context", response_model=ApiResponse[AnomalyContext])
async def get_anomaly_context(
    anomaly_id: str,
    service: AnomalyService = Depends(get_anomaly_service),
) -> ApiResponse[AnomalyContext]:
    ctx = await service.get_anomaly_context(anomaly_id)
    if not ctx:
        return ApiResponse(success=False, message="Anomalía no encontrada")
    return ApiResponse(data=AnomalyContext(**ctx))


@router.patch("/{anomaly_id}", response_model=ApiResponse[AnomalyResponse])
async def review_anomaly(
    anomaly_id: str,
    payload: AnomalyReviewPayload,
    service: AnomalyService = Depends(get_anomaly_service),
) -> ApiResponse[AnomalyResponse]:
    anomaly = await service.review_anomaly(
        anomaly_id=anomaly_id,
        reviewer_id=payload.reviewer_id,
        status=payload.status,
        notes=payload.notes,
        dismissal_reason=payload.dismissal_reason,
    )
    if not anomaly:
        return ApiResponse(success=False, message="Anomalía no encontrada")
    return ApiResponse(data=AnomalyResponse.model_validate(anomaly, from_attributes=True))
