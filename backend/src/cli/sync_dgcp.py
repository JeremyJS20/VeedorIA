import argparse
import asyncio
import logging
from datetime import date, datetime, timezone

from src.infrastructure.database import async_session_maker
from src.services.sync_service import run_sync

logger = logging.getLogger("veedoria.cli.sync_dgcp")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Sincronizar datos con la API DGCP")
    parser.add_argument("--start-date", type=str, help="Fecha de inicio (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="Fecha de fin (YYYY-MM-DD)")
    parser.add_argument("--incremental", action="store_true", help="Sync incremental desde último sync")
    parser.add_argument("--batch-size", type=int, default=500, help="Registros por batch")
    args = parser.parse_args()

    start_date: date | None = None
    end_date: date | None = None

    if args.start_date:
        start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
    if args.end_date:
        end_date = datetime.strptime(args.end_date, "%Y-%m-%d").date()

    logger.info("Starting sync (incremental=%s, start=%s, end=%s)", args.incremental, start_date, end_date)

    async with async_session_maker() as session:
        result = await run_sync(
            session=session,
            start_date=start_date,
            end_date=end_date,
            incremental=args.incremental,
            triggered_by="cli",
        )

    logger.info(
        "Sync %s: status=%s, records=%d, duration=%.1fs",
        result.id,
        result.status,
        result.records_synced,
        (result.completed_at - result.started_at).total_seconds() if result.completed_at else 0,
    )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    asyncio.run(main())
