import logging

from src.infrastructure.queue import get_arq_pool

logger = logging.getLogger("veedoria.presentation.runners")

# `_job_id` fijo: arq rechaza encolar un job con un id ya existente, así que el
# mutex vive en Redis y es atómico entre procesos. Sin esto `enqueue_job`
# siempre devuelve un Job y la comprobación `job is None` nunca se cumple.
DETECTION_JOB_ID = "veedoria:detection"
SYNC_JOB_ID = "veedoria:sync"


async def run_detection() -> str:
    pool = await get_arq_pool()
    job = await pool.enqueue_job("detection_job", _job_id=DETECTION_JOB_ID)
    if job is None:
        raise RuntimeError("La detección de anomalías ya está en ejecución")
    logger.info("Detection enqueued (job=%s)", job.job_id)
    return job.job_id


async def run_sync(full: bool = False, **kwargs) -> str:
    pool = await get_arq_pool()
    job = await pool.enqueue_job(
        "sync_job",
        _job_id=SYNC_JOB_ID,
        full=full,
        **kwargs,
    )
    if job is None:
        raise RuntimeError("La sincronización ya está en ejecución")
    logger.info("Sync enqueued (job=%s)", job.job_id)
    return job.job_id
