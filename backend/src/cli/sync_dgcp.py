import argparse
import asyncio
import logging

from src.infrastructure.database import async_session_maker, engine
from src.services.sync_service import run_sync

logger = logging.getLogger("veedoria.cli.sync_dgcp")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Sincronizar datos con la API DGCP")
    parser.add_argument("--full", action="store_true", help="Full rebuild: JSON contracts + JSON items + JSON suppliers (~11 min con --rate-limit 5.0)")
    parser.add_argument("--days-back", type=int, help="Días hacia atrás para contratos (default: config)")
    parser.add_argument("--skip-institutions", action="store_true", help="Omitir fase de instituciones")
    parser.add_argument("--skip-processes", action="store_true", help="Omitir fase de procesos")
    parser.add_argument("--skip-contracts", action="store_true", help="Omitir fase de contratos JSON")
    parser.add_argument("--skip-items", action="store_true", help="Omitir items de contratos")
    parser.add_argument("--skip-suppliers", action="store_true", help="Omitir suppliers")
    parser.add_argument("--rate-limit", type=float, help="Sobreescribir rate limit (req/s)")

    args = parser.parse_args()

    def compute_sync_type() -> str:
        if not args.full:
            return "incremental"
        if not (args.skip_institutions or args.skip_processes or args.skip_contracts or args.skip_items or args.skip_suppliers):
            return "full"
        parts = []
        if not args.skip_institutions:
            parts.append("institutions")
        if not args.skip_processes:
            parts.append("processes")
        if not args.skip_contracts:
            parts.append("contracts")
        if not args.skip_items:
            parts.append("items")
        if not args.skip_suppliers:
            parts.append("suppliers")
        return "+".join(parts)

    sync_type = compute_sync_type()

    await engine.dispose()
    async with async_session_maker() as session:
            result = await run_sync(
                session=session,
                full=args.full,
                days_back=args.days_back,
                skip_institutions=args.skip_institutions,
                skip_processes=args.skip_processes,
                skip_contracts=args.skip_contracts,
                skip_items=args.skip_items,
                skip_suppliers=args.skip_suppliers,
                rate_limit=args.rate_limit,
                triggered_by="cli",
                sync_type=sync_type,
            )
    logger.info(
        "Sync %s: status=%s, records=%d, duration=%.1fs",
        result.id,
        result.status,
        result.records_synced,
        (result.completed_at - result.started_at).total_seconds() if result.completed_at else 0,
    )


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
