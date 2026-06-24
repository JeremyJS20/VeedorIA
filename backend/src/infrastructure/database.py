import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.config import settings

logger = logging.getLogger("veedoria.infrastructure.database")

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def verify_db_health() -> bool:
    try:
        async with async_session_maker() as session:
            from sqlmodel import text
            await session.execute(text("SELECT 1;"))
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
