"""Bitácora paginada, exportación auditada y health de servicios (Wave 2).

`AuditLog` es estrictamente de solo lectura: este servicio nunca actualiza ni
elimina filas de la bitácora, solo agrega la traza de la propia exportación.
"""

import asyncio
import csv
import hashlib
import io
import json
import logging
import time
from datetime import UTC, datetime, timedelta
from inspect import isawaitable

from sqlalchemy import func, select, text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.models.auth import AppUser
from src.models.sync_log import SyncLog
from src.models.user import User
from src.services.admin_ops_errors import (
    EXPORT_TOO_LARGE,
    FORBIDDEN_ADMIN,
    INVALID_DATE_RANGE,
    VALIDATION_ERROR,
    AdminOpsError,
)
from src.services.admin_sync_service import AdminSyncService

logger = logging.getLogger("veedoria.services.admin_audit")

DEFAULT_PAGE = 1
DEFAULT_LIMIT = 25
MAX_PAGE_SIZE = 100
EXPORT_MAX_ROWS = 10000
CHECK_TIMEOUT_S = 3.0
STALE_WINDOW = timedelta(hours=48)
CSV_FIELDS = (
    "id",
    "timestamp",
    "action_type",
    "user_id",
    "user_email",
    "entity_type",
    "entity_id",
    "ip_address",
    "old_value",
    "new_value",
)
EXPORT_FORMATS = frozenset({"csv", "json"})


class AdminAuditService:
    """Consulta, exportación y health de la consola administrativa."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Guardas y helpers ────────────────────────────────────────────────
    def _assert_platform_admin(self, current_user: dict) -> None:
        role_code = (current_user.get("rol") or {}).get("codigo")
        if role_code != "PLATFORM_ADMIN":
            raise AdminOpsError(
                FORBIDDEN_ADMIN,
                "Esta consola de operaciones requiere el rol PLATFORM_ADMIN.",
            )

    def _parse_date(
        self, raw: str | None, *, end_of_day: bool
    ) -> datetime | None:
        """Normaliza `YYYY-MM-DD` o ISO 8601 a datetime naive en UTC."""
        if raw is None:
            return None
        text = str(raw).strip()
        if not text:
            return None
        candidate = f"{text[:-1]}+00:00" if text.endswith("Z") else text
        try:
            parsed = datetime.fromisoformat(candidate)
        except ValueError as exc:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Fecha inválida: '{text}'. Use el formato YYYY-MM-DD o ISO 8601.",
            ) from exc
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(UTC).replace(tzinfo=None)
        if end_of_day and len(text) == 10:
            parsed = parsed.replace(hour=23, minute=59, second=59, microsecond=999999)
        return parsed

    def _build_filters(
        self,
        action_type: str | None = None,
        user_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> tuple[list, dict]:
        """Traduce los filtros de la API a condiciones SQL y a su resumen."""
        conditions = []
        applied: dict = {}

        if action_type and str(action_type).strip():
            value = str(action_type).strip()
            conditions.append(AuditLog.action_type == value)
            applied["action_type"] = value
        if user_id and str(user_id).strip():
            value = str(user_id).strip()
            conditions.append(AuditLog.user_id == value)
            applied["user_id"] = value
        if entity_type and str(entity_type).strip():
            value = str(entity_type).strip()
            conditions.append(AuditLog.entity_type == value)
            applied["entity_type"] = value
        if entity_id and str(entity_id).strip():
            value = str(entity_id).strip()
            conditions.append(AuditLog.entity_id == value)
            applied["entity_id"] = value

        start = self._parse_date(date_from, end_of_day=False)
        end = self._parse_date(date_to, end_of_day=True)
        if start and end and start > end:
            raise AdminOpsError(
                INVALID_DATE_RANGE,
                "El rango de fechas es inválido: date_from es posterior a date_to.",
            )
        if start is not None:
            conditions.append(AuditLog.timestamp >= start)
            applied["date_from"] = start.isoformat()
        if end is not None:
            conditions.append(AuditLog.timestamp <= end)
            applied["date_to"] = end.isoformat()

        return conditions, applied

    async def _count(self, conditions: list) -> int:
        stmt = select(func.count()).select_from(AuditLog).where(*conditions)
        return int((await self.db.execute(stmt)).scalar() or 0)

    async def _fetch(
        self, conditions: list, *, offset: int = 0, limit: int = DEFAULT_LIMIT
    ) -> list[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(*conditions)
            .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def _resolve_emails(self, user_ids: set[str]) -> dict[str, str]:
        """Resuelve correos best-effort (AppUser y tabla legacy `user`)."""
        emails: dict[str, str] = {}
        if not user_ids:
            return emails
        numeric: dict[int, str] = {}
        for raw in user_ids:
            try:
                numeric[int(raw)] = raw
            except (TypeError, ValueError):
                continue
        try:
            if numeric:
                rows = (
                    await self.db.execute(
                        select(AppUser.id, AppUser.correo).where(
                            AppUser.id.in_(list(numeric))
                        )
                    )
                ).all()
                for user_pk, correo in rows:
                    raw = numeric.get(user_pk)
                    if raw and correo:
                        emails[raw] = correo
            missing = [raw for raw in user_ids if raw not in emails]
            if missing:
                rows = (
                    await self.db.execute(
                        select(User.id, User.email).where(User.id.in_(missing))
                    )
                ).all()
                for legacy_id, email in rows:
                    if legacy_id and email:
                        emails.setdefault(legacy_id, email)
        except Exception as exc:  # resolución de correo: nunca rompe la consulta
            logger.debug("No se pudieron resolver correos de la bitácora: %s", exc)
        return emails

    def _serialize(self, log: AuditLog, emails: dict[str, str]) -> dict:
        return {
            "id": log.id,
            "action_type": log.action_type,
            "user_id": log.user_id,
            "user_email": emails.get(log.user_id) if log.user_id else None,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }

    # ── Bitácora ─────────────────────────────────────────────────────────
    async def list_audit_logs(
        self,
        current_user: dict,
        action_type: str | None = None,
        user_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        page: int = 1,
        limit: int = 25,
    ) -> dict:
        """Bitácora paginada por acción, usuario, entidad y rango de fechas."""
        self._assert_platform_admin(current_user)

        conditions, _applied = self._build_filters(
            action_type=action_type,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            date_from=date_from,
            date_to=date_to,
        )
        page = max(int(page or DEFAULT_PAGE), 1)
        limit = min(max(int(limit or DEFAULT_LIMIT), 1), MAX_PAGE_SIZE)

        total = await self._count(conditions)
        rows = await self._fetch(
            conditions, offset=(page - 1) * limit, limit=limit
        )
        emails = await self._resolve_emails(
            {row.user_id for row in rows if row.user_id}
        )

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "items": [self._serialize(row, emails) for row in rows],
        }

    @staticmethod
    def _json_cell(value) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        return json.dumps(value, ensure_ascii=False, default=str)

    def _to_csv(self, items: list[dict]) -> str:
        buffer = io.StringIO()
        writer = csv.DictWriter(
            buffer, fieldnames=list(CSV_FIELDS), lineterminator="\n"
        )
        writer.writeheader()
        for item in items:
            writer.writerow(
                {
                    "id": item["id"],
                    "timestamp": item["timestamp"] or "",
                    "action_type": item["action_type"],
                    "user_id": item["user_id"] or "",
                    "user_email": item["user_email"] or "",
                    "entity_type": item["entity_type"],
                    "entity_id": item["entity_id"],
                    "ip_address": item["ip_address"] or "",
                    "old_value": self._json_cell(item["old_value"]),
                    "new_value": self._json_cell(item["new_value"]),
                }
            )
        return buffer.getvalue()

    async def export_audit_logs(
        self, current_user: dict, export_format: str = "csv", **filters
    ) -> dict:
        """Exporta la bitácora filtrada con tope de filas y checksum SHA-256."""
        self._assert_platform_admin(current_user)

        fmt = str(export_format or "csv").strip().lower()
        if fmt not in EXPORT_FORMATS:
            raise AdminOpsError(
                VALIDATION_ERROR,
                "Formato de exportación inválido. Use 'csv' o 'json'.",
            )

        conditions, applied = self._build_filters(
            action_type=filters.get("action_type"),
            user_id=filters.get("user_id"),
            entity_type=filters.get("entity_type"),
            entity_id=filters.get("entity_id"),
            date_from=filters.get("date_from"),
            date_to=filters.get("date_to"),
        )

        total = await self._count(conditions)
        if total > EXPORT_MAX_ROWS:
            raise AdminOpsError(
                EXPORT_TOO_LARGE,
                f"El filtro devuelve {total} filas y el máximo exportable es "
                f"{EXPORT_MAX_ROWS}. Acote el rango de fechas o los criterios.",
            )

        rows = await self._fetch(conditions, offset=0, limit=EXPORT_MAX_ROWS)
        emails = await self._resolve_emails(
            {row.user_id for row in rows if row.user_id}
        )
        items = [self._serialize(row, emails) for row in rows]

        if fmt == "csv":
            content = self._to_csv(items)
            media_type = "text/csv"
        else:
            content = json.dumps(items, ensure_ascii=False, default=str)
            media_type = "application/json"

        checksum = hashlib.sha256(content.encode("utf-8")).hexdigest()
        generated_at = utcnow_naive()
        filename = f"audit-logs-{generated_at:%Y%m%d-%H%M%S}.{fmt}"

        self.db.add(
            AuditLog(
                action_type="AUDIT_LOG_EXPORT",
                user_id=str(current_user["id"]),
                entity_type="audit_log",
                entity_id=filename,
                new_value={
                    "format": fmt,
                    "rows": len(items),
                    "filters": applied,
                    "checksum_sha256": checksum,
                },
                timestamp=generated_at,
            )
        )
        await self.db.commit()

        return {
            "content": content,
            "media_type": media_type,
            "checksum_sha256": checksum,
            "filename": filename,
        }

    # ── Health de servicios ──────────────────────────────────────────────
    async def _guard(self, key: str, label: str, probe) -> dict:
        """Ejecuta un check aislado: su fallo solo degrada ese componente."""
        started = time.perf_counter()
        try:
            outcome = probe()
            if isawaitable(outcome):
                outcome = await asyncio.wait_for(
                    outcome, timeout=CHECK_TIMEOUT_S
                )
            status, detail = outcome
        except Exception as exc:  # aislamiento total entre componentes
            logger.warning("Health check %s falló: %s", key, exc)
            status = "DOWN"
            detail = f"{type(exc).__name__}: {exc}"
        latency = round((time.perf_counter() - started) * 1000, 1)
        return {
            "key": key,
            "label": label,
            "status": status,
            "detail": detail,
            "latency_ms": latency,
        }

    def _probe_api(self) -> tuple[str, str]:
        version = "desconocida"
        try:
            from src.presentation.main import app as fastapi_app

            version = str(fastapi_app.version)
        except Exception as exc:  # la app puede no estar importada aún
            logger.debug("Versión de la API no disponible: %s", exc)
        return "OK", f"VeedorIA API v{version} respondiendo."

    async def _probe_database(self) -> tuple[str, str]:
        value = (await self.db.execute(sa_text("SELECT 1"))).scalar()
        if value != 1:
            return "DOWN", f"SELECT 1 devolvió {value!r}."
        return "OK", "SELECT 1 respondió correctamente."

    async def _probe_redis_worker(self, current_user: dict) -> tuple[str, str]:
        status = await AdminSyncService(self.db).queue_status(current_user)
        redis_status = status.get("redis")
        worker = status.get("worker")
        depth = status.get("queue_depth")
        failed = status.get("failed_jobs_24h")
        if redis_status == "OK" and worker == "OK":
            return (
                "OK",
                f"Redis OK · worker activo · cola {depth} · fallos 24h {failed}.",
            )
        if redis_status == "OK":
            return (
                "DEGRADED",
                f"Redis OK sin latido de worker · cola {depth} · "
                f"fallos 24h {failed}.",
            )
        return "DOWN", f"Redis OFFLINE · worker {worker} · cola {depth}."

    async def _probe_process(
        self, process_type: str, label: str
    ) -> tuple[str, str]:
        stmt = (
            select(SyncLog)
            .where(SyncLog.process_type == process_type)
            .order_by(SyncLog.started_at.desc())
            .limit(1)
        )
        log = (await self.db.execute(stmt)).scalars().first()
        if log is None:
            return "DOWN", f"Sin registros de {label} en sync_log."

        reference = log.completed_at or log.started_at
        if reference is not None and reference.tzinfo is not None:
            reference = reference.astimezone(UTC).replace(tzinfo=None)
        stamp = reference.isoformat() if reference else "sin fecha"
        age = utcnow_naive() - reference if reference else None

        if (
            log.status == "completed"
            and age is not None
            and age <= STALE_WINDOW
        ):
            return "OK", f"Última corrida completed · {stamp}."
        if log.status == "failed":
            return "DEGRADED", f"Última corrida failed · {stamp}."
        hours = round(age.total_seconds() / 3600, 1) if age else None
        return "DEGRADED", f"Última corrida {log.status} hace {hours} h · {stamp}."

    def _probe_scheduler(self) -> tuple[str, str]:
        try:
            from src.presentation.main import scheduler as app_scheduler

            running = bool(getattr(app_scheduler, "running", False))
            jobs = list(app_scheduler.get_jobs()) if running else []
        except Exception as exc:
            return "DEGRADED", f"Scheduler no accesible: {exc}"
        if running and jobs:
            return "OK", f"APScheduler activo con {len(jobs)} jobs programados."
        if not running:
            return (
                "DEGRADED",
                "El scheduler de APScheduler no está iniciado en este proceso "
                "(modo desarrollo o pruebas).",
            )
        return "DEGRADED", "El scheduler está corriendo pero sin jobs registrados."

    async def get_services_health(self, current_user: dict) -> dict:
        """Health aislado de API, base de datos, Redis, worker y schedulers."""
        self._assert_platform_admin(current_user)

        components = [
            await self._guard("api", "API", self._probe_api),
            await self._guard("database", "Base de datos", self._probe_database),
            await self._guard(
                "redis_worker",
                "Redis y worker",
                lambda: self._probe_redis_worker(current_user),
            ),
            await self._guard(
                "last_sync",
                "Última sincronización",
                lambda: self._probe_process("sync", "sincronización"),
            ),
            await self._guard(
                "last_detection",
                "Última detección",
                lambda: self._probe_process("detection", "detección"),
            ),
            await self._guard("scheduler", "Scheduler", self._probe_scheduler),
        ]

        return {
            "checked_at": utcnow_naive().isoformat(),
            "status": worst_status(components),
            "components": components,
        }


def worst_status(components: list[dict]) -> str:
    """Estado agregado: `DOWN` gana sobre `DEGRADED`, y `DEGRADED` sobre `OK`."""
    statuses = {component["status"] for component in components}
    if "DOWN" in statuses:
        return "DOWN"
    if "DEGRADED" in statuses:
        return "DEGRADED"
    return "OK"
