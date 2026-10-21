"""Contratos del servicio de operaciones de sincronización (Wave 2)."""

from sqlalchemy.ext.asyncio import AsyncSession


class AdminSyncService:
    """Estado, disparo y cola de la sincronización con la DGCP."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def overview(self, current_user: dict, limit: int = 10) -> dict:
        """KPIs de la última corrida, histórico y fallos de las últimas 24h."""
        raise NotImplementedError

    async def trigger_sync(self, current_user: dict, payload: dict) -> dict:
        """Dispara una corrida de sincronización aplicando el mutex de unicidad."""
        raise NotImplementedError

    async def queue_status(self, current_user: dict) -> dict:
        """Estado degradable de Redis, worker y profundidad de la cola."""
        raise NotImplementedError
