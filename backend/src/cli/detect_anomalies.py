import asyncio
import logging

from src.infrastructure.database import async_session_maker, engine
from src.services.anomaly_service import AnomalyService

logger = logging.getLogger("veedoria.cli.detect_anomalies")


async def main() -> None:
    await engine.dispose()
    async with async_session_maker() as session:
        svc = AnomalyService(db=session)
        result = await svc.run_full_detection()
    logger.info(
        "Detection complete: %d price, %d fragmentation, %d collusion",
        result.get("price_anomalies", 0),
        result.get("fragmentation", 0),
        result.get("collusion", 0),
    )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    asyncio.run(main())
