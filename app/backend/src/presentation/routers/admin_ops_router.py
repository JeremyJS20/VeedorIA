"""Endpoints de la consola de administración global (`/api/admin/*`)."""

import logging

from fastapi import APIRouter, Depends, FastAPI, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.types import ApiErrorResponse, ApiResponse
from src.infrastructure.dependencies import get_db
from src.presentation.dependencies import get_current_user
from src.services.admin_calibration_service import AdminCalibrationService
from src.services.admin_ops_errors import (
    DETECTION_ALREADY_RUNNING,
    EXPORT_TOO_LARGE,
    FORBIDDEN_ADMIN,
    FORBIDDEN_CONFIG_EDIT,
    INVALID_DATE_RANGE,
    QUEUE_UNAVAILABLE,
    SYNC_ALREADY_RUNNING,
    TICKET_CLOSED,
    TICKET_NOT_FOUND,
    VALIDATION_ERROR,
    AdminOpsError,
)
from src.services.admin_sync_service import AdminSyncService

logger = logging.getLogger("veedoria.presentation.routers.admin_ops")

router = APIRouter(prefix="/admin", tags=["admin-ops"])

ADMIN_OPS_ERROR_STATUS: dict[str, int] = {
    FORBIDDEN_ADMIN: 403,
    FORBIDDEN_CONFIG_EDIT: 403,
    SYNC_ALREADY_RUNNING: 409,
    DETECTION_ALREADY_RUNNING: 409,
    TICKET_CLOSED: 409,
    QUEUE_UNAVAILABLE: 503,
    TICKET_NOT_FOUND: 404,
    INVALID_DATE_RANGE: 422,
    VALIDATION_ERROR: 422,
    EXPORT_TOO_LARGE: 413,
}
DEFAULT_ERROR_STATUS = 400


class SyncTriggerPayload(BaseModel):
    full: bool = Field(default=False)
    skip_institutions: bool = Field(default=False)
    skip_processes: bool = Field(default=False)
    skip_contracts: bool = Field(default=False)
    skip_items: bool = Field(default=False)
    skip_suppliers: bool = Field(default=False)
    days_back: int | None = Field(default=90)
    rate_limit: float = Field(default=5.0)


class DetectionConfigPayload(BaseModel):
    parameters: dict[str, float] = Field(default_factory=dict)


class ResetPayload(BaseModel):
    keys: list[str] | None = Field(default=None)


class CalibrationApplyPayload(BaseModel):
    changes: dict[str, float] = Field(default_factory=dict)


def get_admin_sync_service(db: AsyncSession = Depends(get_db)) -> AdminSyncService:
    return AdminSyncService(db=db)


def get_admin_calibration_service(
    db: AsyncSession = Depends(get_db),
) -> AdminCalibrationService:
    return AdminCalibrationService(db=db)


async def admin_ops_error_handler(request: Request, exc: AdminOpsError) -> JSONResponse:
    """Traduce `AdminOpsError` al mismo envelope JSON que usa `AppError`."""
    status_code = ADMIN_OPS_ERROR_STATUS.get(exc.code, DEFAULT_ERROR_STATUS)
    logger.debug("AdminOpsError %s → HTTP %s", exc.code, status_code)
    content = ApiErrorResponse(success=False, error=exc.message).model_dump()
    content["code"] = exc.code
    return JSONResponse(status_code=status_code, content=content)


def install_admin_ops_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AdminOpsError, admin_ops_error_handler)


# ── Sincronización ─────────────────────────────────────────────────────────
@router.get("/sync/overview", response_model=ApiResponse[dict])
async def get_sync_overview(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    service: AdminSyncService = Depends(get_admin_sync_service),
):
    data = await service.overview(current_user, limit=limit)
    return ApiResponse(success=True, data=data)


@router.post("/sync/trigger", status_code=202, response_model=ApiResponse[dict])
async def trigger_sync(
    payload: SyncTriggerPayload,
    current_user: dict = Depends(get_current_user),
    service: AdminSyncService = Depends(get_admin_sync_service),
):
    data = await service.trigger_sync(current_user, payload.model_dump())
    return ApiResponse(success=True, data=data, message="Sincronización encolada")


@router.get("/queue/status", response_model=ApiResponse[dict])
async def get_queue_status(
    current_user: dict = Depends(get_current_user),
    service: AdminSyncService = Depends(get_admin_sync_service),
):
    data = await service.queue_status(current_user)
    return ApiResponse(success=True, data=data)


# ── Motor de detección ─────────────────────────────────────────────────────
@router.get("/detection-config", response_model=ApiResponse[dict])
async def get_detection_config(
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.get_detection_config(current_user)
    return ApiResponse(success=True, data=data)


@router.put("/detection-config", response_model=ApiResponse[dict])
async def update_detection_config(
    payload: DetectionConfigPayload,
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.update_detection_config(
        current_user, payload.parameters
    )
    return ApiResponse(success=True, data=data)


@router.post("/detection-config/reset", response_model=ApiResponse[dict])
async def reset_detection_config(
    payload: ResetPayload,
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.reset_detection_config(current_user, payload.keys)
    return ApiResponse(success=True, data=data)


@router.get("/calibration/analysis", response_model=ApiResponse[dict])
async def get_calibration_analysis(
    anomaly_type: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.get_calibration_analysis(current_user, anomaly_type)
    return ApiResponse(success=True, data=data)


@router.post("/calibration/apply", response_model=ApiResponse[dict])
async def apply_calibration(
    payload: CalibrationApplyPayload,
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.apply_calibration(current_user, payload.changes)
    return ApiResponse(success=True, data=data)


@router.post("/detection/run", status_code=202, response_model=ApiResponse[dict])
async def trigger_detection(
    current_user: dict = Depends(get_current_user),
    service: AdminCalibrationService = Depends(get_admin_calibration_service),
):
    data = await service.trigger_detection(current_user)
    return ApiResponse(success=True, data=data, message="Detección encolada")
