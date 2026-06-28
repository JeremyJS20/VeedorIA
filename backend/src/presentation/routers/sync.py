import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import desc

from src.domain.types import ApiResponse
from src.infrastructure.dependencies import get_db
from src.models.sync_log import SyncLog
from src.presentation.runners import run_sync as launch_sync

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
    full: bool = Query(False, description="Full rebuild: all entities from DGCP JSON API"),
    skip_institutions: bool = Query(False, description="Omitir fase de instituciones"),
    skip_processes: bool = Query(False, description="Omitir fase de procesos"),
    skip_contracts: bool = Query(False, description="Omitir fase de contratos"),
    skip_items: bool = Query(False, description="Omitir items de contratos"),
    skip_suppliers: bool = Query(False, description="Omitir suppliers"),
    rate_limit: float = Query(5.0, description="Requests per second a la API DGCP"),
    days_back: int | None = Query(None, description="Días hacia atrás para filtrar contratos (default: 90)"),
) -> ApiResponse:
    stmt = select(SyncLog).where(SyncLog.status == "running")
    result = await session.execute(stmt)
    if result.scalars().first():
        return ApiResponse(success=False, message="Sync ya está en progreso")

    sync_type = _compute_sync_type(full, skip_institutions, skip_processes, skip_contracts, skip_items, skip_suppliers)
    try:
        pid = await launch_sync(
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
    return ApiResponse(success=True, data={"pid": pid, "sync_type": sync_type}, message="Sync started")


@router.get("/status")
async def sync_status(
    session: AsyncSession = Depends(get_db),
) -> ApiResponse:
    stmt = select(SyncLog).order_by(desc(SyncLog.started_at)).limit(10)
    result = await session.execute(stmt)
    logs = result.scalars().all()

    last_completed = None
    for log in logs:
        if log.status == "completed":
            last_completed = log
            break

    return ApiResponse(
        success=True,
        data={
            "last_sync": {
                "id": last_completed.id if last_completed else None,
                "status": last_completed.status if last_completed else None,
                "records": last_completed.records_synced if last_completed else 0,
                "sync_type": last_completed.sync_type if last_completed else None,
                "completed_at": last_completed.completed_at.isoformat() if last_completed and last_completed.completed_at else None,
            } if last_completed else None,
            "recent_logs": [
                {
                    "id": log.id,
                    "status": log.status,
                    "records": log.records_synced,
                    "started_at": log.started_at.isoformat(),
                    "completed_at": log.completed_at.isoformat() if log.completed_at else None,
                    "error": log.error_message,
                    "triggered_by": log.triggered_by,
                    "sync_type": log.sync_type,
                }
                for log in logs
            ],
        },
    )
