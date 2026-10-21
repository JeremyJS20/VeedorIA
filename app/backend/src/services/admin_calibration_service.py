"""Contratos del servicio de calibración del motor de detección (Wave 2)."""

from sqlalchemy.ext.asyncio import AsyncSession


class AdminCalibrationService:
    """Parámetros globales, análisis de precisión y corridas de detección."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_detection_config(self, current_user: dict) -> dict:
        """Devuelve los parámetros del motor con rango, paso y valor por defecto."""
        raise NotImplementedError

    async def update_detection_config(
        self, current_user: dict, updates: dict
    ) -> dict:
        """Actualiza parámetros con clamp a `[min, max]` y auditoría del diff."""
        raise NotImplementedError

    async def reset_detection_config(
        self, current_user: dict, keys: list[str]
    ) -> dict:
        """Restaura los parámetros indicados a su valor por defecto."""
        raise NotImplementedError

    async def get_calibration_analysis(
        self, current_user: dict, anomaly_type: str | None = None
    ) -> dict:
        """Calcula TP/FP/FN, precision, recall y F1 por tipo de anomalía."""
        raise NotImplementedError

    async def apply_calibration(
        self, current_user: dict, changes: dict
    ) -> dict:
        """Persiste umbrales recomendados y audita la aplicación."""
        raise NotImplementedError

    async def trigger_detection(self, current_user: dict) -> dict:
        """Dispara una corrida manual de detección con mutex de unicidad."""
        raise NotImplementedError
