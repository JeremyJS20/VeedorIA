import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import desc

from src.domain.types import ApiResponse
from src.infrastructure.database import async_session_maker
from src.infrastructure.dependencies import get_db
from src.models.sync_log import SyncLog
from src.services.sync_service import run_sync

logger = logging.getLogger("veedoria.presentation.routers.sync")
router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/dgcp", status_code=202)
async def trigger_dgcp_sync(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
) -> ApiResponse:
    sync_log = SyncLog(status="running", triggered_by="api")
    session.add(sync_log)
    await session.commit()
    await session.refresh(sync_log)
    sync_id = sync_log.id

    async def _run(task_id: int) -> None:
        async with async_session_maker() as s:
            try:
                from src.infrastructure.dgcp_client import DGCPClient
                async with DGCPClient() as client:
                    from datetime import date
                    from src.services.sync_service import sync_full
                    records = await sync_full(client, s, date(2025, 6, 24), date.today())
                stmt = select(SyncLog).where(SyncLog.id == task_id)
                result = await s.execute(stmt)
                log = result.scalar_one_or_none()
                if log:
                    log.status = "completed"
                    log.records_synced = records
                    log.completed_at = datetime.now(timezone.utc)
                    await s.commit()
            except Exception as e:
                logger.exception("Sync task %d failed", task_id)
                stmt = select(SyncLog).where(SyncLog.id == task_id)
                result = await s.execute(stmt)
                log = result.scalar_one_or_none()
                if log:
                    log.status = "failed"
                    log.error_message = str(e)
                    log.completed_at = datetime.now(timezone.utc)
                    await s.commit()

    background_tasks.add_task(_run, sync_id)
    return ApiResponse(success=True, data={"sync_id": sync_id}, message="Sync started")


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
                }
                for log in logs
            ],
        },
    )
