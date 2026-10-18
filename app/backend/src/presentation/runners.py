import logging

from src.infrastructure.queue import get_arq_pool

logger = logging.getLogger("veedoria.presentation.runners")


async def run_detection() -> str:
    pool = await get_arq_pool()
    job = await pool.enqueue_job("detection_job")
    if job is None:
        raise RuntimeError("La detección de anomalías ya está en ejecución")
    logger.info("Detection enqueued (job=%s)", job.job_id)
    return job.job_id


async def run_sync(full: bool = False, **kwargs) -> str:
    pool = await get_arq_pool()
    job = await pool.enqueue_job(
        "sync_job",
        full=full,
        **kwargs,
    )
    if job is None:
        raise RuntimeError("La sincronización ya está en ejecución")
    logger.info("Sync enqueued (job=%s)", job.job_id)
    return job.job_id
