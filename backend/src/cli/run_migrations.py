import asyncio
import logging
import os
from pathlib import Path

from sqlalchemy import text

from src.infrastructure.database import engine

logger = logging.getLogger("veedoria.cli.run_migrations")

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent.parent / "migrations"


async def ensure_tracking_table() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _applied_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT NOW()
            )
        """))
        await conn.commit()


async def get_applied() -> set[str]:
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT filename FROM _applied_migrations ORDER BY filename"))
        return {row[0] for row in result.all()}


async def mark_applied(filename: str) -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text("INSERT INTO _applied_migrations (filename) VALUES (:f) ON CONFLICT DO NOTHING"),
            {"f": filename},
        )
        await conn.commit()


async def run_migrations() -> None:
    await ensure_tracking_table()
    applied = await get_applied()

    if not MIGRATIONS_DIR.exists():
        logger.info("No migrations directory found at %s", MIGRATIONS_DIR)
        return

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        logger.info("No SQL migration files found")
        return

    for f in sql_files:
        if f.name in applied:
            logger.info("SKIP %s (already applied)", f.name)
            continue

        sql = f.read_text(encoding="utf-8").strip()
        if not sql:
            logger.info("SKIP %s (empty)", f.name)
            await mark_applied(f.name)
            continue

        logger.info("RUN  %s", f.name)
        try:
            async with engine.begin() as conn:
                for statement in sql.split(";"):
                    stmt = statement.strip()
                    if stmt:
                        await conn.execute(text(stmt))
                await conn.commit()
            await mark_applied(f.name)
            logger.info("DONE %s", f.name)
        except Exception as e:
            logger.error("FAIL %s: %s", f.name, e)
            raise

    logger.info("All migrations complete")


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(levelname)s | %(message)s")
    try:
        await run_migrations()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
