import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import desc

from src.domain.types import ApiResponse
from src.infrastructure.dependencies import get_db
from src.models.sync_log import SyncLog
from src.presentation.dependencies import require_platform_admin
from src.presentation.runners import run_sync as launch_sync
from src.services.sync_lock import get_active_run

logger = logging.getLogger("veedoria.presentation.routers.sync")
router = APIRouter(prefix="/sync", tags=["sync"])


def _compute_sync_type(full: bool, skip_institutions: bool, skip_processes: bool,
                       skip_contracts: bool, skip_items: bool, skip_suppliers: bool) -> str:
    if not full:
        return "incremental"
    if not (skip_institutions or skip_processes or skip_contracts or skip_items or skip_suppliers):
        return "full"
    parts = []
    if not skip_institutions:
        parts.append("institutions")
    if not skip_processes:
        parts.append("processes")
    if not skip_contracts:
        parts.append("contracts")
    if not skip_items:
        parts.append("items")
    if not skip_suppliers:
        parts.append("suppliers")
    return "+".join(parts)


@router.post("/dgcp", status_code=202)
async def trigger_dgcp_sync(
    session: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(require_platform_admin()),
    full: bool = Query(False, description="Full rebuild: all entities from DGCP JSON API"),
    skip_institutions: bool = Query(False, description="Omitir fase de instituciones"),
    skip_processes: bool = Query(False, description="Omitir fase de procesos"),
    skip_contracts: bool = Query(False, description="Omitir fase de contratos"),
    skip_items: bool = Query(False, description="Omitir items de contratos"),
    skip_suppliers: bool = Query(False, description="Omitir suppliers"),
    rate_limit: float = Query(5.0, description="Requests per second a la API DGCP"),
    days_back: int | None = Query(None, description="Días hacia atrás para filtrar contratos (default: 90)"),
) -> ApiResponse:
    if await get_active_run(session):
        return ApiResponse(success=False, message="Sync ya está en progreso")

    sync_type = _compute_sync_type(full, skip_institutions, skip_processes, skip_contracts, skip_items, skip_suppliers)
    try:
        tag = await launch_sync(
            full=full,
            days_back=days_back,
            skip_institutions=skip_institutions,
            skip_processes=skip_processes,
            skip_contracts=skip_contracts,
            skip_items=skip_items,
            skip_suppliers=skip_suppliers,
            rate_limit=rate_limit,
        )
    except RuntimeError as e:
        return ApiResponse(success=False, message=str(e))
    return ApiResponse(success=True, data={"task": tag, "sync_type": sync_type}, message="Sync started")


def _serialize_log(log: SyncLog) -> dict:
    return {
        "id": log.id,
        "process_type": log.process_type,
        "status": log.status,
        "records": log.records_synced,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        "error": log.error_message,
        "triggered_by": log.triggered_by,
        "sync_type": log.sync_type,
        "details": log.details,
    }


@router.get("/status")
async def sync_status(
    session: AsyncSession = Depends(get_db),
) -> ApiResponse:
    stmt = select(SyncLog).order_by(desc(SyncLog.started_at)).limit(10)
    result = await session.execute(stmt)
    logs = result.scalars().all()

    last_sync = None
    sync_logs: list[dict] = []
    detection_logs: list[dict] = []

    for log in logs:
        if log.process_type == "sync":
            sync_logs.append(_serialize_log(log))
            if not last_sync and log.status == "completed":
                last_sync = sync_logs[-1]
        else:
            detection_logs.append(_serialize_log(log))

    return ApiResponse(
        success=True,
        data={
            "last_sync": last_sync,
            "recent_syncs": sync_logs,
            "recent_detections": detection_logs,
        },
    )
