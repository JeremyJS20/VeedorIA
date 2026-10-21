"""Guardia de exclusión mutua para ingesta y detección.

`sync_log.status == "running"` es la señal de que hay una corrida en curso. El
problema es que esa fila la abre el worker al arrancar y solo se cierra al
terminar: si el worker muere sin cerrarla, la fila queda huérfana y bloquea
cualquier corrida nueva. La recuperación `running` → `failed` del lifespan solo
corre al reiniciar la API, así que con el worker caído y la API viva el candado
queda trabado para siempre.

Por eso las filas más viejas que `RUNNING_STALE_AFTER` se consideran abandonadas
y no bloquean. El tope es holgado frente a `job_timeout` del worker (3600 s):
arq cancela cualquier job que lo exceda, así que una corrida de más de dos horas
no puede ser legítima.
"""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.sync_log import SyncLog

RUNNING_STALE_AFTER = timedelta(hours=2)


async def get_active_run(
    session: AsyncSession, process_type: str | None = None
) -> SyncLog | None:
    """Última corrida en curso y no vencida.

    `process_type=None` considera cualquier proceso (comportamiento histórico del
    disparador de ingesta, que frena ante cualquier corrida en curso).
    """
    stmt = select(SyncLog).where(
        SyncLog.status == "running",
        SyncLog.started_at >= utcnow_naive() - RUNNING_STALE_AFTER,
    )
    if process_type is not None:
        stmt = stmt.where(SyncLog.process_type == process_type)

    stmt = stmt.order_by(SyncLog.started_at.desc()).limit(1)
    return (await session.execute(stmt)).scalars().first()
