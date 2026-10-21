"""Contratos del servicio de bitácora y health de servicios (Wave 2)."""

from sqlalchemy.ext.asyncio import AsyncSession


class AdminAuditService:
    """Consulta, exportación y health de la consola administrativa."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_audit_logs(self, current_user: dict, **filters) -> dict:
        """Bitácora paginada por acción, usuario, entidad y rango de fechas."""
        raise NotImplementedError

    async def export_audit_logs(
        self, current_user: dict, format: str = "csv", **filters
    ) -> dict:
        """Exporta la bitácora filtrada con tope de filas y checksum SHA-256."""
        raise NotImplementedError

    async def get_services_health(self, current_user: dict) -> dict:
        """Health aislado de API, base de datos, Redis, worker y schedulers."""
        raise NotImplementedError
