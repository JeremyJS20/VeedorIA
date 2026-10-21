"""Monitoreo programado del estado de servicios.

El bloque de salud de `/app/soporte` se recalcula solo cuando alguien abre la
página, así que una caída nocturna del worker se descubre recién cuando alguien
entra por casualidad. Este servicio corre en el scheduler, compara el estado
calculado contra el último evento registrado y escribe en `audit_log` **solo
cuando cambia**: la transición queda en la Bitácora (`/app/bitacora`), que ya es
auditable y exportable con checksum.

`_dispatch()` es el punto de extensión para sumar canales: un webhook de
Slack/Teams se enchufa ahí sin tocar la detección de transiciones.
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.services.admin_audit_service import AdminAuditService, worst_status

logger = logging.getLogger("veedoria.services.health_monitor")

HEALTH_ENTITY_TYPE = "service_health"
HEALTH_ENTITY_ID = "services"

#: Frecuencia del chequeo programado, en minutos.
CHECK_INTERVAL_MINUTES = 5

# El job corre dentro del proceso de la API y no tiene usuario detrás. Los probes
# que reutiliza (`get_services_health`) validan rol PLATFORM_ADMIN, así que se
# ejecuta con un principal de sistema explícito: no impersona a nadie, solo pasa
# el guard. El evento se registra con `user_id=None` para distinguirlo de una
# acción humana.
SYSTEM_PRINCIPAL: dict = {
    "id": None,
    "correo": "system@veedoria",
    "rol": {"codigo": "PLATFORM_ADMIN"},
    "permisos": [],
    "tenant": None,
}


class HealthMonitorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _components(self) -> list[dict]:
        """Componentes de salud. Aislado para poder sustituirlo en tests."""
        health = await AdminAuditService(self.db).get_services_health(SYSTEM_PRINCIPAL)
        return health["components"]

    async def last_transition(self) -> dict | None:
        """Última transición registrada. Alimenta el badge de la UI."""
        stmt = (
            select(AuditLog)
            .where(AuditLog.entity_type == HEALTH_ENTITY_TYPE)
            .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
            .limit(1)
        )
        row = (await self.db.execute(stmt)).scalars().first()
        if row is None:
            return None

        payload = row.new_value if isinstance(row.new_value, dict) else {}
        return {
            "action": row.action_type,
            "status": payload.get("status"),
            "previous": payload.get("previous"),
            "failing": payload.get("failing", []),
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
        }

    async def evaluate_and_record(self) -> dict | None:
        """Registra la transición solo si el estado cambió.

        Devuelve el evento escrito, o `None` si no hubo cambio (o si es la primera
        lectura y ya está sana, que no es una transición).
        """
        components = await self._components()
        current = worst_status(components)
        previous = await self._last_recorded_status()

        if previous == current:
            return None
        # Sin estado previo conocido, un arranque sano no es una transición: solo
        # se registra si la plataforma ya viene degradada.
        if previous is None and current == "OK":
            return None

        failing = [
            {
                "key": component["key"],
                "status": component["status"],
                "detail": component["detail"],
            }
            for component in components
            if component["status"] != "OK"
        ]
        action_type = "HEALTH_RECOVERED" if current == "OK" else "HEALTH_DEGRADED"
        now = utcnow_naive()
        event = {
            "action": action_type,
            "status": current,
            "previous": previous,
            "failing": failing,
            "timestamp": now.isoformat(),
        }

        self.db.add(
            AuditLog(
                action_type=action_type,
                # Evento de sistema: sin usuario detrás.
                user_id=None,
                entity_type=HEALTH_ENTITY_TYPE,
                entity_id=HEALTH_ENTITY_ID,
                old_value={"status": previous},
                new_value={
                    "status": current,
                    "previous": previous,
                    "failing": failing,
                },
                timestamp=now,
            )
        )
        await self.db.commit()
        await self._dispatch(event)
        return event

    async def _last_recorded_status(self) -> str | None:
        transition = await self.last_transition()
        return transition["status"] if transition else None

    async def _dispatch(self, event: dict) -> None:
        """Punto de extensión de notificaciones.

        Hoy el único canal es `audit_log`, escrito antes de llegar acá y visible en
        `/app/bitacora`. Para sumar Slack/Teams basta con POSTear `event` desde este
        método; la detección de transiciones no cambia.
        """
        failing = ", ".join(
            f"{item['key']}:{item['status']}" for item in event["failing"]
        )
        logger.warning(
            "Estado de servicios %s → %s (%s)",
            event["previous"],
            event["status"],
            failing or "sin componentes en falla",
        )
