import asyncio
import json
import logging
from datetime import UTC, datetime

from src.infrastructure.database import async_session_maker, engine
from src.models.sync_log import SyncLog
from src.services.anomaly_service import AnomalyService

logger = logging.getLogger("veedoria.cli.detect_anomalies")


async def main() -> None:
    await engine.dispose()
    async with async_session_maker() as session:
        sync_log = SyncLog(
            process_type="detection",
            triggered_by="cli",
            sync_type="full",
        )
        session.add(sync_log)
        await session.commit()
        await session.refresh(sync_log)
        log_id = sync_log.id

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
    except Exception as e:
        logger.exception("Detection failed: %s", e)
        async with async_session_maker() as session:
            log = await session.get_one(SyncLog, log_id)
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.now(UTC).replace(tzinfo=None)
            await session.commit()


if __name__ == "__main__":
    class _FlushingHandler(logging.StreamHandler):
        def emit(self, record):
            super().emit(record)
            self.flush()

    _handler = _FlushingHandler()
    _handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logging.basicConfig(level=logging.INFO, handlers=[_handler])
    asyncio.run(main())
