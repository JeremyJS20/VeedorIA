"""Endpoints de la consola de administración global (`/api/admin/*`)."""

import logging

from fastapi import APIRouter, Depends, FastAPI, Query, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.types import ApiErrorResponse, ApiResponse
from src.infrastructure.dependencies import get_db
from src.presentation.dependencies import get_current_user
from src.services.admin_audit_service import AdminAuditService
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
from src.services.admin_support_service import AdminSupportService
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


class SupportTicketUpdatePayload(BaseModel):
    status: str | None = Field(default=None)
    assigned_to_id: int | None = Field(default=None)
    reply: str | None = Field(default=None)


def get_admin_sync_service(db: AsyncSession = Depends(get_db)) -> AdminSyncService:
    return AdminSyncService(db=db)


def get_admin_audit_service(db: AsyncSession = Depends(get_db)) -> AdminAuditService:
    return AdminAuditService(db=db)


def get_admin_support_service(
    db: AsyncSession = Depends(get_db),
) -> AdminSupportService:
    return AdminSupportService(db=db)


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


# ── Bitácora (solo lectura estricta) ───────────────────────────────────────
@router.get("/audit-logs", response_model=ApiResponse[dict])
async def list_audit_logs(
    action_type: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    entity_id: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AdminAuditService = Depends(get_admin_audit_service),
):
    data = await service.list_audit_logs(
        current_user,
        action_type=action_type,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=data)


@router.get("/audit-logs/export")
async def export_audit_logs(
    action_type: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    entity_id: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    export_format: str = Query(default="csv", alias="format", pattern="^(csv|json)$"),
    current_user: dict = Depends(get_current_user),
    service: AdminAuditService = Depends(get_admin_audit_service),
):
    data = await service.export_audit_logs(
        current_user,
        export_format=export_format,
        action_type=action_type,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        date_from=date_from,
        date_to=date_to,
    )
    return Response(
        content=data["content"],
        media_type=data["media_type"],
        headers={
            "Content-Disposition": (
                f'attachment; filename="{data["filename"]}"'
            ),
            "X-Checksum-SHA256": data["checksum_sha256"],
        },
    )


# ── Health de servicios ────────────────────────────────────────────────────
@router.get("/health/services", response_model=ApiResponse[dict])
async def get_services_health(
    current_user: dict = Depends(get_current_user),
    service: AdminAuditService = Depends(get_admin_audit_service),
):
    data = await service.get_services_health(current_user)
    return ApiResponse(success=True, data=data)


# ── Bandeja administrativa de tickets ──────────────────────────────────────
@router.get("/support/tickets", response_model=ApiResponse[dict])
async def list_support_tickets(
    status: str | None = Query(default=None),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_admin_support_service),
):
    data = await service.list_tickets(
        current_user,
        status=status,
        category=category,
        q=q,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=data)


@router.get("/support/tickets/{ticket_id}", response_model=ApiResponse[dict])
async def get_support_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_admin_support_service),
):
    data = await service.get_ticket(current_user, ticket_id)
    return ApiResponse(success=True, data=data)


@router.patch("/support/tickets/{ticket_id}", response_model=ApiResponse[dict])
async def update_support_ticket(
    ticket_id: int,
    payload: SupportTicketUpdatePayload,
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_admin_support_service),
):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise AdminOpsError(
            VALIDATION_ERROR,
            "Debe enviar al menos un campo: status, assigned_to_id o reply.",
        )
    data = await service.update_ticket(current_user, ticket_id, changes)
    return ApiResponse(success=True, data=data, message="Ticket actualizado")

