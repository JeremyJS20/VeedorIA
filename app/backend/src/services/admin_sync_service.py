"""Servicio de operaciones de sincronización con la DGCP (Wave 2)."""

import asyncio
import logging
from datetime import timedelta

import redis
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.queue import get_arq_pool
from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.models.sync_log import SyncLog
from src.presentation.routers.sync import _compute_sync_type
from src.presentation.runners import run_sync
from src.services.admin_ops_errors import (
    FORBIDDEN_ADMIN,
    QUEUE_UNAVAILABLE,
    SYNC_ALREADY_RUNNING,
    VALIDATION_ERROR,
    AdminOpsError,
)
from src.services.sync_lock import get_active_run

logger = logging.getLogger("veedoria.services.admin_sync")

# Nombre real de la cola de arq: `arq.constants.default_queue_name` y
# `arq.constants.health_check_key_suffix` (el worker publica el latido en
# `f"{queue_name}:health-check"` con un PTTL de `health_check_interval + 1`).
ARQ_QUEUE_NAME = "arq:queue"
ARQ_HEALTH_CHECK_KEY = f"{ARQ_QUEUE_NAME}:health-check"
ARQ_TIMEOUT_S = 3.0
RECENT_SYNCS_FOR_AVERAGE = 10
DEFAULT_DAYS_BACK = 90
DEFAULT_RATE_LIMIT = 5.0
DEFAULT_LIMIT = 10
FAILURES_WINDOW = timedelta(hours=24)

CONNECTION_ERRORS = (ConnectionError, OSError, redis.exceptions.RedisError, RuntimeError)


class AdminSyncService:
    """Estado, disparo y cola de la sincronización con la DGCP."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _assert_platform_admin(self, current_user: dict) -> None:
        role_code = (current_user.get("rol") or {}).get("codigo")
        if role_code != "PLATFORM_ADMIN":
            raise AdminOpsError(
                FORBIDDEN_ADMIN,
                "Esta consola de operaciones requiere el rol PLATFORM_ADMIN.",
            )

    def _serialize_log(self, log: SyncLog) -> dict:
        duration = None
        if log.started_at and log.completed_at:
            duration = round(
                (log.completed_at - log.started_at).total_seconds(), 1
            )
        return {
            "id": log.id,
            "process_type": log.process_type,
            "status": log.status,
            "records_synced": log.records_synced,
            "started_at": log.started_at.isoformat() if log.started_at else None,
            "completed_at": (
                log.completed_at.isoformat() if log.completed_at else None
            ),
            "duration_s": duration,
            "error_message": log.error_message,
            "triggered_by": log.triggered_by,
            "sync_type": log.sync_type,
        }

    async def _recent_logs(self, process_type: str, limit: int) -> list[SyncLog]:
        stmt = (
            select(SyncLog)
            .where(SyncLog.process_type == process_type)
            .order_by(desc(SyncLog.started_at))
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def _last_log(self, process_type: str, status: str) -> SyncLog | None:
        stmt = (
            select(SyncLog)
            .where(
                SyncLog.process_type == process_type,
                SyncLog.status == status,
            )
            .order_by(desc(SyncLog.started_at))
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalars().first()

    async def overview(self, current_user: dict, limit: int = DEFAULT_LIMIT) -> dict:
        """KPIs de la última corrida, histórico y fallos de las últimas 24h."""
        self._assert_platform_admin(current_user)
        safe_limit = min(max(int(limit or DEFAULT_LIMIT), 1), 50)

        syncs = await self._recent_logs("sync", safe_limit)
        detections = await self._recent_logs("detection", safe_limit)

        last_completed = await self._last_log("sync", "completed")
        running = await get_active_run(self.db, "sync")

        completed_stmt = (
            select(SyncLog)
            .where(
                SyncLog.process_type == "sync",
                SyncLog.status == "completed",
                SyncLog.completed_at.is_not(None),
            )
            .order_by(desc(SyncLog.started_at))
            .limit(RECENT_SYNCS_FOR_AVERAGE)
        )
        completed = list((await self.db.execute(completed_stmt)).scalars().all())
        durations = [
            round((log.completed_at - log.started_at).total_seconds(), 1)
            for log in completed
            if log.completed_at and log.started_at
        ]
        avg_duration = (
            round(sum(durations) / len(durations), 1) if durations else 0.0
        )

        since = utcnow_naive() - FAILURES_WINDOW
        failures_stmt = (
            select(func.count())
            .select_from(SyncLog)
            .where(
                SyncLog.process_type == "sync",
                SyncLog.status == "failed",
                SyncLog.started_at >= since,
            )
        )
        failures_24h = int((await self.db.execute(failures_stmt)).scalar() or 0)

        return {
            "kpis": {
                "last_sync": (
                    self._serialize_log(last_completed) if last_completed else None
                ),
                "records_total": (
                    int(last_completed.records_synced or 0) if last_completed else 0
                ),
                "avg_duration_s": avg_duration,
                "failures_24h": failures_24h,
                "running": self._serialize_log(running) if running else None,
            },
            "syncs": [self._serialize_log(log) for log in syncs],
            "detections": [self._serialize_log(log) for log in detections],
        }

    async def trigger_sync(self, current_user: dict, payload: dict) -> dict:
        """Dispara una corrida de sincronización aplicando el mutex de unicidad."""
        self._assert_platform_admin(current_user)

        if await get_active_run(self.db, "sync"):
            raise AdminOpsError(
                SYNC_ALREADY_RUNNING, "La sincronización ya está en ejecución"
            )

        payload = payload or {}
        full = bool(payload.get("full", False))
        skip_institutions = bool(payload.get("skip_institutions", False))
        skip_processes = bool(payload.get("skip_processes", False))
        skip_contracts = bool(payload.get("skip_contracts", False))
        skip_items = bool(payload.get("skip_items", False))
        skip_suppliers = bool(payload.get("skip_suppliers", False))

        raw_days_back = payload.get("days_back", DEFAULT_DAYS_BACK)
        days_back = DEFAULT_DAYS_BACK if raw_days_back is None else raw_days_back
        try:
            days_back = int(days_back)
        except (TypeError, ValueError) as exc:
            raise AdminOpsError(
                VALIDATION_ERROR, "days_back debe ser un entero de días mayor o igual a 1."
            ) from exc
        if days_back < 1:
            raise AdminOpsError(
                VALIDATION_ERROR, "days_back debe ser un entero de días mayor o igual a 1."
            )

        raw_rate_limit = payload.get("rate_limit", DEFAULT_RATE_LIMIT)
        try:
            rate_limit = float(
                DEFAULT_RATE_LIMIT if raw_rate_limit is None else raw_rate_limit
            )
        except (TypeError, ValueError) as exc:
            raise AdminOpsError(
                VALIDATION_ERROR, "rate_limit debe ser un número mayor que 0."
            ) from exc
        if rate_limit <= 0:
            raise AdminOpsError(
                VALIDATION_ERROR, "rate_limit debe ser un número mayor que 0."
            )

        sync_type = _compute_sync_type(
            full,
            skip_institutions,
            skip_processes,
            skip_contracts,
            skip_items,
            skip_suppliers,
        )

        try:
            job_id = await run_sync(
                full=full,
                skip_institutions=skip_institutions,
                skip_processes=skip_processes,
                skip_contracts=skip_contracts,
                skip_items=skip_items,
                skip_suppliers=skip_suppliers,
                days_back=days_back,
                rate_limit=rate_limit,
            )
        except CONNECTION_ERRORS as exc:
            if isinstance(exc, RuntimeError) and "ya está en ejecución" in str(exc):
                raise AdminOpsError(
                    SYNC_ALREADY_RUNNING, "La sincronización ya está en ejecución"
                ) from exc
            logger.warning("Sync no encolada (cola no disponible): %s", exc)
            raise AdminOpsError(
                QUEUE_UNAVAILABLE,
                "La cola de trabajos no está disponible en este momento. Intente más tarde.",
            ) from exc

        self.db.add(
            AuditLog(
                action_type="SYNC_TRIGGERED",
                user_id=str(current_user["id"]),
                entity_type="sync",
                entity_id=str(job_id),
                new_value={
                    "full": full,
                    "skip_institutions": skip_institutions,
                    "skip_processes": skip_processes,
                    "skip_contracts": skip_contracts,
                    "skip_items": skip_items,
                    "skip_suppliers": skip_suppliers,
                    "days_back": days_back,
                    "rate_limit": rate_limit,
                    "sync_type": sync_type,
                },
                timestamp=utcnow_naive(),
            )
        )
        await self.db.commit()

        return {"task": job_id, "sync_type": sync_type}

    async def queue_status(self, current_user: dict) -> dict:
        """Estado degradable de Redis, worker y profundidad de la cola."""
        self._assert_platform_admin(current_user)

        redis_status = "OFFLINE"
        worker_status = "DOWN"
        queue_depth = 0

        try:
            pool = await asyncio.wait_for(get_arq_pool(), timeout=ARQ_TIMEOUT_S)
            await asyncio.wait_for(pool.ping(), timeout=ARQ_TIMEOUT_S)
            redis_status = "OK"
            queue_depth = int(
                await asyncio.wait_for(
                    pool.zcard(ARQ_QUEUE_NAME), timeout=ARQ_TIMEOUT_S
                )
                or 0
            )
            # arq escribe el latido con `psetex(health_check_interval + 1)`, de
            # modo que la sola existencia de la clave implica un worker vivo
            # dentro de su ventana de health check.
            heartbeat = await asyncio.wait_for(
                pool.exists(ARQ_HEALTH_CHECK_KEY), timeout=ARQ_TIMEOUT_S
            )
            worker_status = "OK" if heartbeat else "DOWN"
        except Exception as exc:  # degradación explícita, nunca 500
            logger.warning("Estado de cola no disponible: %s", exc)
            redis_status = "OFFLINE"
            worker_status = "DOWN"
            queue_depth = 0

        since = utcnow_naive() - FAILURES_WINDOW
        failed_stmt = (
            select(func.count())
            .select_from(SyncLog)
            .where(SyncLog.status == "failed", SyncLog.started_at >= since)
        )
        failed_jobs_24h = int((await self.db.execute(failed_stmt)).scalar() or 0)

        return {
            "redis": redis_status,
            "worker": worker_status,
            "queue_depth": queue_depth,
            "failed_jobs_24h": failed_jobs_24h,
            "checked_at": utcnow_naive().isoformat(),
        }
