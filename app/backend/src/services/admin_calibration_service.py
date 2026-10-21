"""Servicio de calibración del motor de detección (Wave 2)."""

import logging

import redis
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.anomaly import Anomaly
from src.models.audit_log import AuditLog
from src.models.detection_config import DetectionConfig
from src.models.sync_log import SyncLog
from src.presentation.runners import run_detection
from src.services.admin_ops_errors import (
    DETECTION_ALREADY_RUNNING,
    FORBIDDEN_ADMIN,
    QUEUE_UNAVAILABLE,
    VALIDATION_ERROR,
    AdminOpsError,
)
from src.services.auditor_b2g_service import DEFAULT_DETECTION_CONFIG
from src.services.calibration_core import (
    CONFIRMED,
    DISMISSED,
    FRAGMENTATION_GRID,
    ZSCORE_GRID,
    best_threshold,
    evaluate_threshold,
)

logger = logging.getLogger("veedoria.services.admin_calibration")

PRICE_ANOMALY = "PRICE_ANOMALY"
FRAGMENTATION = "FRAGMENTATION"
COLLUSION = "COLLUSION"
ANOMALY_TYPES = (PRICE_ANOMALY, FRAGMENTATION, COLLUSION)
REVIEWED_STATUSES = (CONFIRMED, DISMISSED)

# Claves de `detection_config` que consumen `anomaly_service` y `tune_detection`.
PRICE_ZSCORE_KEY = "price_zscore_threshold"
PRICE_DEVIATION_KEY = "price_min_deviation_pct"
FRAGMENTATION_KEY = "fragmentation_threshold_dop"

# Whitelist de calibración con sus rangos operativos.
CALIBRATION_RANGES: dict[str, tuple[float, float]] = {
    PRICE_ZSCORE_KEY: (0.5, 4.0),
    PRICE_DEVIATION_KEY: (25.0, 150.0),
    FRAGMENTATION_KEY: (3_000_000.0, 12_000_000.0),
}

COLLUSION_SEVERITY_LEVELS = (("ALTA", 0.75), ("MEDIA", 0.5), ("BAJA", 0.0))
CONNECTION_ERRORS = (ConnectionError, OSError, redis.exceptions.RedisError, RuntimeError)


def _round4(value: float) -> float:
    """Redondea a 4 decimales sin arrastrar la imprecisión binaria del float."""
    return float(f"{value:.4f}")


class AdminCalibrationService:
    """Parámetros globales, análisis de precisión y corridas de detección."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _assert_platform_admin(self, current_user: dict) -> None:
        role_code = (current_user.get("rol") or {}).get("codigo")
        if role_code != "PLATFORM_ADMIN":
            raise AdminOpsError(
                FORBIDDEN_ADMIN,
                "Esta consola de calibración requiere el rol PLATFORM_ADMIN.",
            )

    async def _config_map(self) -> dict[str, DetectionConfig]:
        rows = (await self.db.execute(select(DetectionConfig))).scalars().all()
        return {row.key: row for row in rows}

    async def _ensure_catalog(self) -> dict[str, DetectionConfig]:
        """Siembra las claves faltantes del catálogo global de 13 parámetros."""
        config_map = await self._config_map()
        for key, meta in DEFAULT_DETECTION_CONFIG.items():
            if key not in config_map:
                row = DetectionConfig(key=key, value=float(meta["value"]))
                self.db.add(row)
                config_map[key] = row
        await self.db.commit()
        return config_map

    def _catalog(self, config_map: dict[str, DetectionConfig]) -> list[dict]:
        parameters = []
        for key, meta in DEFAULT_DETECTION_CONFIG.items():
            row = config_map.get(key)
            value = (
                float(row.value)
                if row is not None and row.value is not None
                else float(meta["value"])
            )
            updated_at = getattr(row, "updated_at", None) if row is not None else None
            parameters.append(
                {
                    "key": key,
                    "label": meta["label"],
                    "category": meta["category"],
                    "value": value,
                    "default_value": float(meta["value"]),
                    "min": float(meta["min"]),
                    "max": float(meta["max"]),
                    "step": float(meta["step"]),
                    "description": meta["description"],
                    "updated_at": updated_at.isoformat() if updated_at else None,
                }
            )
        return parameters

    def _audit(
        self,
        current_user: dict,
        action_type: str,
        entity_id: str,
        old_value: dict | None = None,
        new_value: dict | None = None,
    ) -> AuditLog:
        return AuditLog(
            action_type=action_type,
            user_id=str(current_user["id"]),
            entity_type="detection_config",
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            timestamp=utcnow_naive(),
        )

    async def get_detection_config(self, current_user: dict) -> dict:
        """Devuelve los parámetros del motor con rango, paso y valor por defecto."""
        self._assert_platform_admin(current_user)
        config_map = await self._ensure_catalog()
        return {"parameters": self._catalog(config_map)}

    async def update_detection_config(
        self, current_user: dict, updates: dict
    ) -> dict:
        """Actualiza parámetros con clamp a `[min, max]` y auditoría del diff."""
        self._assert_platform_admin(current_user)
        updates = updates or {}

        invalid = [key for key in updates if key not in DEFAULT_DETECTION_CONFIG]
        if invalid:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Parámetros desconocidos: {sorted(invalid)}.",
            )

        config_map = await self._ensure_catalog()
        old_values: dict[str, float] = {}
        new_values: dict[str, float] = {}
        adjusted: dict[str, dict] = {}

        for key, raw_value in updates.items():
            meta = DEFAULT_DETECTION_CONFIG[key]
            try:
                requested = float(raw_value)
            except (TypeError, ValueError) as exc:
                raise AdminOpsError(
                    VALIDATION_ERROR,
                    f"El parámetro '{key}' requiere un valor numérico.",
                ) from exc
            applied = max(float(meta["min"]), min(requested, float(meta["max"])))
            row = config_map[key]
            old_values[key] = float(row.value)
            new_values[key] = applied
            row.value = applied
            row.updated_at = utcnow_naive()
            if applied != requested:
                adjusted[key] = {"requested": requested, "applied": applied}

        if new_values:
            self.db.add(
                self._audit(
                    current_user,
                    "UPDATE_DETECTION_CONFIG",
                    "global",
                    old_value=old_values,
                    new_value={
                        "actor_correo": current_user.get("correo"),
                        "actor_nombre": current_user.get("nombre"),
                        "parameters": new_values,
                    },
                )
            )
        # Una sola transacción: si el commit falla no se aplica ningún cambio.
        await self.db.commit()

        return {
            "parameters": self._catalog(config_map),
            "adjusted": adjusted,
        }

    async def reset_detection_config(
        self, current_user: dict, keys: list[str] | None = None
    ) -> dict:
        """Restaura los parámetros indicados a su valor por defecto."""
        self._assert_platform_admin(current_user)

        targets = list(DEFAULT_DETECTION_CONFIG) if not keys else list(dict.fromkeys(keys))
        invalid = [key for key in targets if key not in DEFAULT_DETECTION_CONFIG]
        if invalid:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Parámetros desconocidos: {sorted(invalid)}.",
            )

        config_map = await self._ensure_catalog()
        old_values: dict[str, float] = {}
        new_values: dict[str, float] = {}
        now = utcnow_naive()
        for key in targets:
            meta = DEFAULT_DETECTION_CONFIG[key]
            default_value = float(meta["value"])
            row = config_map[key]
            old_values[key] = float(row.value)
            new_values[key] = default_value
            row.value = default_value
            row.updated_at = now

        self.db.add(
            self._audit(
                current_user,
                "DETECTION_CONFIG_RESET",
                "global",
                old_value=old_values,
                new_value={
                    "actor_correo": current_user.get("correo"),
                    "actor_nombre": current_user.get("nombre"),
                    "keys": targets,
                    "parameters": new_values,
                },
            )
        )
        await self.db.commit()

        return {"parameters": self._catalog(config_map), "reset": targets}

    async def _reviews(self, anomaly_type: str) -> list[tuple[float, str]]:
        stmt = select(Anomaly).where(
            Anomaly.anomaly_type == anomaly_type,
            Anomaly.status.in_(REVIEWED_STATUSES),
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        reviews: list[tuple[float, str]] = []
        for row in rows:
            if anomaly_type == PRICE_ANOMALY:
                # El grid de z-scores se evalúa sobre la magnitud de la desviación.
                reviews.append((abs(float(row.score or 0.0)), row.status))
            elif anomaly_type == FRAGMENTATION:
                reviews.append((float(row.amount or 0.0), row.status))
            else:
                reviews.append((float(row.score or row.severity or 0.0), row.status))
        return reviews

    async def _confirmation_rate_by_level(self, anomaly_type: str) -> dict:
        stmt = select(Anomaly).where(
            Anomaly.anomaly_type == anomaly_type,
            Anomaly.status.in_(REVIEWED_STATUSES),
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        buckets: dict[str, dict[str, int]] = {
            level: {"confirmed": 0, "dismissed": 0} for level, _ in COLLUSION_SEVERITY_LEVELS
        }
        for row in rows:
            severity = float(row.severity or 0.0)
            level = "BAJA"
            for label, minimum in COLLUSION_SEVERITY_LEVELS:
                if severity >= minimum:
                    level = label
                    break
            if row.status == CONFIRMED:
                buckets[level]["confirmed"] += 1
            else:
                buckets[level]["dismissed"] += 1

        rates: dict[str, dict] = {}
        for level, counts in buckets.items():
            total = counts["confirmed"] + counts["dismissed"]
            rates[level] = {
                "reviewed": total,
                "confirmed": counts["confirmed"],
                "rate": round(counts["confirmed"] / total, 4) if total else 0.0,
            }
        return rates

    async def _current_threshold(self, anomaly_type: str) -> float | None:
        if anomaly_type == PRICE_ANOMALY:
            key = PRICE_ZSCORE_KEY
        elif anomaly_type == FRAGMENTATION:
            key = FRAGMENTATION_KEY
        else:
            return None
        row = (
            await self.db.execute(
                select(DetectionConfig).where(DetectionConfig.key == key)
            )
        ).scalars().first()
        return float(row.value) if row is not None and row.value is not None else None

    async def get_calibration_analysis(
        self, current_user: dict, anomaly_type: str | None = None
    ) -> dict:
        """Calcula TP/FP/FN, precision, recall y F1 por tipo de anomalía."""
        self._assert_platform_admin(current_user)

        requested = str(anomaly_type).strip().upper() if anomaly_type else None
        if requested and requested not in ANOMALY_TYPES:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Tipo de anomalía inválido: {requested}. Válidos: {list(ANOMALY_TYPES)}.",
            )
        types = [requested] if requested else list(ANOMALY_TYPES)

        analysis: list[dict] = []
        insufficient_data: list[str] = []

        for current_type in types:
            reviews = await self._reviews(current_type)
            if not reviews:
                insufficient_data.append(current_type)

            if current_type == PRICE_ANOMALY:
                grid = list(ZSCORE_GRID)
            elif current_type == FRAGMENTATION:
                grid = list(FRAGMENTATION_GRID)
            else:
                grid = []

            if current_type == COLLUSION:
                # Sin umbral numérico: el hallazgo se considera levantado siempre,
                # de modo que TP/FP son los dictámenes recibidos.
                metrics = evaluate_threshold(reviews, 0.0)
                recommended = None
            else:
                recommended = best_threshold(reviews, grid)
                metrics = evaluate_threshold(
                    reviews, grid[0] if recommended is None else recommended
                )

            entry = {
                "anomaly_type": current_type,
                "reviews": len(reviews),
                "tp": metrics["tp"],
                "fp": metrics["fp"],
                "fn": metrics["fn"],
                "precision": _round4(metrics["precision"]),
                "recall": _round4(metrics["recall"]),
                "f1": _round4(metrics["f1"]),
                "current_threshold": await self._current_threshold(current_type),
                "recommended_threshold": recommended,
                "grid": grid,
            }
            if current_type == COLLUSION:
                entry["confirmation_rate_by_level"] = (
                    await self._confirmation_rate_by_level(current_type)
                )
            analysis.append(entry)

        return {
            "generated_at": utcnow_naive().isoformat(),
            "types": analysis,
            "insufficient_data": insufficient_data,
        }

    async def apply_calibration(self, current_user: dict, changes: dict) -> dict:
        """Persiste umbrales recomendados y audita la aplicación."""
        self._assert_platform_admin(current_user)
        changes = changes or {}

        invalid = [key for key in changes if key not in CALIBRATION_RANGES]
        if invalid:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Claves de calibración no permitidas: {sorted(invalid)}. "
                f"Permitidas: {sorted(CALIBRATION_RANGES)}.",
            )
        if not changes:
            raise AdminOpsError(
                VALIDATION_ERROR, "Debe indicar al menos un umbral a calibrar."
            )

        config_map = await self._config_map()
        applied: dict[str, float] = {}
        adjusted: dict[str, dict] = {}
        old_values: dict[str, float | None] = {}

        for key, raw_value in changes.items():
            minimum, maximum = CALIBRATION_RANGES[key]
            try:
                requested = float(raw_value)
            except (TypeError, ValueError) as exc:
                raise AdminOpsError(
                    VALIDATION_ERROR,
                    f"El umbral '{key}' requiere un valor numérico.",
                ) from exc
            value = max(minimum, min(requested, maximum))
            row = config_map.get(key)
            old_values[key] = (
                float(row.value) if row is not None and row.value is not None else None
            )
            applied[key] = value
            if row is not None:
                row.value = value
                row.updated_at = utcnow_naive()
            else:
                # Claves de calibración fuera del catálogo de 13 parámetros.
                self.db.add(DetectionConfig(key=key, value=value))
            if value != requested:
                adjusted[key] = {"requested": requested, "applied": value}

        self.db.add(
            self._audit(
                current_user,
                "CALIBRATION_APPLY",
                "global",
                old_value=old_values,
                new_value={
                    "actor_correo": current_user.get("correo"),
                    "actor_nombre": current_user.get("nombre"),
                    "parameters": applied,
                },
            )
        )
        await self.db.commit()

        return {"applied": applied, "adjusted": adjusted}

    async def trigger_detection(self, current_user: dict) -> dict:
        """Dispara una corrida manual de detección con mutex de unicidad."""
        self._assert_platform_admin(current_user)

        running_stmt = (
            select(SyncLog)
            .where(
                SyncLog.process_type == "detection",
                SyncLog.status == "running",
            )
            .order_by(desc(SyncLog.started_at))
            .limit(1)
        )
        running = (await self.db.execute(running_stmt)).scalars().first()
        if running:
            raise AdminOpsError(
                DETECTION_ALREADY_RUNNING,
                "La detección de anomalías ya está en ejecución",
            )

        try:
            job_id = await run_detection()
        except CONNECTION_ERRORS as exc:
            if isinstance(exc, RuntimeError) and "ya está en ejecución" in str(exc):
                raise AdminOpsError(
                    DETECTION_ALREADY_RUNNING,
                    "La detección de anomalías ya está en ejecución",
                ) from exc
            logger.warning("Detección no encolada (cola no disponible): %s", exc)
            raise AdminOpsError(
                QUEUE_UNAVAILABLE,
                "La cola de trabajos no está disponible en este momento. Intente más tarde.",
            ) from exc

        self.db.add(
            AuditLog(
                action_type="DETECTION_TRIGGERED",
                user_id=str(current_user["id"]),
                entity_type="detection",
                entity_id=str(job_id),
                new_value={
                    "actor_correo": current_user.get("correo"),
                    "actor_nombre": current_user.get("nombre"),
                },
                timestamp=utcnow_naive(),
            )
        )
        await self.db.commit()

        return {"task": job_id}
