from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.sync_log import SyncLog
from src.services.sync_lock import RUNNING_STALE_AFTER, get_active_run


async def _add(session: AsyncSession, **kwargs) -> SyncLog:
    log = SyncLog(**kwargs)
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


class TestGetActiveRun:
    async def test_recent_running_counts_as_active(self, db_session: AsyncSession):
        await _add(db_session, process_type="sync", status="running")

        assert await get_active_run(db_session, "sync") is not None

    async def test_stale_running_is_ignored(self, db_session: AsyncSession):
        """Una fila huérfana (worker muerto sin cerrarla) no bloquea para siempre.

        La recuperación `running` → `failed` solo corre en el lifespan del API, así
        que con el worker caído y la API viva el candado quedaría trabado sin esto.
        """
        await _add(
            db_session,
            process_type="sync",
            status="running",
            started_at=utcnow_naive() - RUNNING_STALE_AFTER - timedelta(minutes=1),
        )

        assert await get_active_run(db_session, "sync") is None

    async def test_completed_is_not_active(self, db_session: AsyncSession):
        await _add(db_session, process_type="sync", status="completed")

        assert await get_active_run(db_session, "sync") is None

    async def test_filters_by_process_type(self, db_session: AsyncSession):
        await _add(db_session, process_type="detection", status="running")

        assert await get_active_run(db_session, "sync") is None
        assert await get_active_run(db_session, "detection") is not None

    async def test_without_process_type_any_run_counts(self, db_session: AsyncSession):
        """El disparador de ingesta frena ante cualquier proceso en curso."""
        await _add(db_session, process_type="detection", status="running")

        assert await get_active_run(db_session) is not None
