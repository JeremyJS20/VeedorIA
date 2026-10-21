import logging

from fastapi import APIRouter, Depends, Query
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
from src.presentation.dependencies import (
    get_anomaly_service,
    get_optional_user,
    require_permission,
)
from src.presentation.runners import run_detection
from src.services.anomaly_service import AnomalyService
from src.services.sync_lock import get_active_run

logger = logging.getLogger("veedoria.presentation.routers.anomaly")
router = APIRouter(prefix="/anomalies", tags=["anomalies"])


def _resolve_tenant_institution_id(
    current_user: dict | None,
    requested_institution_id: int | None = None,
) -> int | None:
    if current_user and current_user.get("tenant"):
        tenant = current_user["tenant"]
        if tenant.get("tipo") == "GOV_INSTITUTION" and tenant.get("institution_id") is not None:
            return int(tenant["institution_id"])
    return requested_institution_id


@router.post("/detect", status_code=202)
async def detect_anomalies(
    session: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_permission("DETECTION_RUN")),
) -> ApiResponse:
    if await get_active_run(session, "detection"):
        return ApiResponse(success=False, message="La detección de anomalías ya está en progreso")

    try:
        tag = await run_detection()
    except RuntimeError as e:
        return ApiResponse(success=False, message=str(e))
    return ApiResponse(success=True, data={"task": tag}, message="Detección de anomalías iniciada en segundo plano.")


@router.get("", response_model=ApiResponse[AnomalyListResponse])
async def list_anomalies(
    service: AnomalyService = Depends(get_anomaly_service),
    current_user: dict | None = Depends(get_optional_user),
    anomaly_type: str | None = Query(None, description="Filtrar por tipo (PRICE_ANOMALY, FRAGMENTATION, COLLUSION)"),
    status: str | None = Query(None, description="Filtrar por estado (PENDING, CONFIRMED, DISMISSED)"),
    min_severity: float | None = Query(None, ge=0.0, le=1.0, description="Severidad mínima"),
    search: str | None = Query(None, description="Búsqueda textual por proceso, contrato, proveedor, institución o descripción"),
    institution_id: int | None = Query(None, description="ID de institución (forzado automáticamente para tenants GOV_INSTITUTION)"),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
) -> ApiResponse[AnomalyListResponse]:
    effective_inst_id = _resolve_tenant_institution_id(current_user, institution_id)
    offset = (page - 1) * limit
    items, total = await service.get_anomalies(
        anomaly_type=anomaly_type,
        status=status,
        min_severity=min_severity,
        search=search,
        institution_id=effective_inst_id,
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
    current_user: dict | None = Depends(get_optional_user),
    institution_id: int | None = Query(None),
) -> ApiResponse[AnomalyStats]:
    effective_inst_id = _resolve_tenant_institution_id(current_user, institution_id)
    stats = await service.get_anomaly_stats(institution_id=effective_inst_id)
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
    current_user: dict = Depends(require_permission("ANOMALY_REVIEW")),
) -> ApiResponse[AnomalyResponse]:
    anomaly = await service.review_anomaly(
        anomaly_id=anomaly_id,
        # El dictamen se atribuye siempre al portador del token: el cliente no
        # elige el reviewer (antes salía del payload y era falsificable).
        reviewer_id=str(current_user["id"]),
        status=payload.status,
        notes=payload.notes,
        dismissal_reason=payload.dismissal_reason,
    )
    if not anomaly:
        return ApiResponse(success=False, message="Anomalía no encontrada")
    return ApiResponse(data=AnomalyResponse.model_validate(anomaly, from_attributes=True))
