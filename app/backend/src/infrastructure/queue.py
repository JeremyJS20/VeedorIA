import logging

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from src.config import settings

logger = logging.getLogger("veedoria.infrastructure.queue")

_pool: ArqRedis | None = None


def _dsn_from_url(url: str) -> str:
    if url.startswith("redis://"):
        return url
    if url.startswith("rediss://"):
        return url
    return url


async def get_arq_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        rs = RedisSettings.from_dsn(_dsn_from_url(settings.redis_url))
        _pool = await create_pool(rs)
        logger.info("arq pool created (redis=%s)", settings.redis_url)
    return _pool


async def close_arq_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("arq pool closed")
