import json
import logging
import os
from datetime import UTC, datetime

from arq.connections import RedisSettings

from src.infrastructure.database import async_session_maker
from src.models.sync_log import SyncLog
from src.services.anomaly_service import AnomalyService

logger = logging.getLogger("veedoria.arq.worker")


async def detection_job(ctx):
    async with async_session_maker() as session:
        sl = SyncLog(process_type="detection", triggered_by="api", sync_type="full")
        session.add(sl)
        await session.commit()
        await session.refresh(sl)
        log_id = sl.id

    try:
        async with async_session_maker() as session:
            svc = AnomalyService(db=session)
            result = await svc.run_full_detection()

        total = sum(result.values())
        details = json.dumps(result)

        async with async_session_maker() as session:
            log = await session.get_one(SyncLog, log_id)
            log.status = "completed"
            log.records_synced = total
            log.details = details
            log.completed_at = datetime.now(UTC).replace(tzinfo=None)
            await session.commit()

        logger.info(
            "Detection complete: %d price, %d fragmentation, %d collusion",
            result.get("price_anomalies", 0),
            result.get("fragmentation", 0),
            result.get("collusion", 0),
        )
        return result
    except Exception as e:
        logger.exception("Detection failed: %s", e)
        async with async_session_maker() as session:
            log = await session.get_one(SyncLog, log_id)
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.now(UTC).replace(tzinfo=None)
            await session.commit()
        raise


redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


async def sync_job(ctx, full: bool = False, **kwargs):
    async with async_session_maker() as session:
        from src.services.sync_service import run_sync

        sync_log = await run_sync(
            session=session, full=full, triggered_by="api", **kwargs
        )
        logger.info(
            "Sync %s: status=%s, records=%d",
            sync_log.id, sync_log.status, sync_log.records_synced or 0,
        )
        return {"id": sync_log.id, "status": sync_log.status}


class WorkerSettings:
    functions = [detection_job, sync_job]
    redis_settings = RedisSettings.from_dsn(redis_url)
    job_timeout = 3600
    keep_result = 86400
