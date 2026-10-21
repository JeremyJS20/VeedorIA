"""Servicio de tickets de soporte del centro de ayuda administrativo."""

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.models.support_ticket import SupportTicket, SupportTicketMessage
from src.services.admin_ops_errors import (
    CODE_GENERATION_FAILED,
    FORBIDDEN_ADMIN,
    TICKET_CLOSED,
    TICKET_NOT_FOUND,
    VALIDATION_ERROR,
    AdminOpsError,
)

CATEGORIES = frozenset(
    {"SOPORTE_FUNCIONAL", "ERROR_TECNICO", "SOLICITUD_DATOS", "FACTURACION"}
)
MODULES = frozenset(
    {"SINCRONIZACION", "CALIBRACION", "BITACORA", "DETECCION", "ACCESOS", "OTRO"}
)
PRIORITIES = frozenset({"ALTA", "MEDIA", "BAJA"})
STATUSES = frozenset({"ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"})
REOPENED_STATUSES = frozenset({"ABIERTO", "EN_PROGRESO"})
CODE_RETRIES = 3


class AdminSupportService:
    """Tickets de soporte: autoservicio del usuario y bandeja administrativa."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _assert_platform_admin(self, current_user: dict) -> None:
        role_code = (current_user.get("rol") or {}).get("codigo")
        if role_code != "PLATFORM_ADMIN":
            raise AdminOpsError(
                FORBIDDEN_ADMIN,
                "Esta operación requiere el rol PLATFORM_ADMIN.",
            )

    async def _next_code(self) -> str:
        """Siguiente correlativo anual `SUP-{YYYY}-{NNNN}`."""
        prefix = f"SUP-{utcnow_naive().year}-"
        last_code = (
            await self.db.execute(
                select(func.max(SupportTicket.code)).where(
                    SupportTicket.code.like(f"{prefix}%")
                )
            )
        ).scalar()
        sequence = 1
        if last_code:
            try:
                sequence = int(str(last_code).rsplit("-", 1)[-1]) + 1
            except (TypeError, ValueError):
                sequence = 1
        return f"{prefix}{sequence:04d}"

    def _serialize_message(self, message: SupportTicketMessage) -> dict:
        return {
            "id": message.id,
            "ticket_id": message.ticket_id,
            "author_id": message.author_id,
            "body": message.body,
            "created_at": (
                message.created_at.isoformat() if message.created_at else None
            ),
        }

    def _serialize(
        self,
        ticket: SupportTicket,
        messages: list[SupportTicketMessage] | None = None,
    ) -> dict:
        return {
            "id": ticket.id,
            "code": ticket.code,
            "subject": ticket.subject,
            "category": ticket.category,
            "module": ticket.module,
            "priority": ticket.priority,
            "description": ticket.description,
            "status": ticket.status,
            "reporter_id": ticket.reporter_id,
            "reporter_tenant_id": ticket.reporter_tenant_id,
            "assigned_to_id": ticket.assigned_to_id,
            "created_at": (
                ticket.created_at.isoformat() if ticket.created_at else None
            ),
            "updated_at": (
                ticket.updated_at.isoformat() if ticket.updated_at else None
            ),
            "closed_at": (
                ticket.closed_at.isoformat() if ticket.closed_at else None
            ),
            "messages": [
                self._serialize_message(m) for m in (messages or [])
            ],
        }

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
            user_id=str(current_user.get("id")),
            entity_type="support_ticket",
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            timestamp=utcnow_naive(),
        )

    async def create_ticket(self, current_user: dict, payload: dict) -> dict:
        """Crea un ticket nuevo en estado ABIERTO con su traza de auditoría."""
        subject = str(payload.get("subject") or "").strip()
        description = str(payload.get("description") or "").strip()
        category = str(payload.get("category") or "SOPORTE_FUNCIONAL").strip().upper()
        module = str(payload.get("module") or "OTRO").strip().upper()
        priority = str(payload.get("priority") or "MEDIA").strip().upper()

        if not subject:
            raise AdminOpsError(
                VALIDATION_ERROR, "El asunto del ticket es obligatorio."
            )
        if not description:
            raise AdminOpsError(
                VALIDATION_ERROR, "La descripción del ticket es obligatoria."
            )
        if category not in CATEGORIES:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Categoría inválida: {category}. Válidas: {sorted(CATEGORIES)}.",
            )
        if module not in MODULES:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Módulo inválido: {module}. Válidos: {sorted(MODULES)}.",
            )
        if priority not in PRIORITIES:
            raise AdminOpsError(
                VALIDATION_ERROR,
                f"Prioridad inválida: {priority}. Válidas: {sorted(PRIORITIES)}.",
            )

        actor = {
            "id": current_user.get("id"),
            "correo": current_user.get("correo"),
        }
        for _attempt in range(CODE_RETRIES):
            now = utcnow_naive()
            ticket = SupportTicket(
                code=await self._next_code(),
                subject=subject,
                category=category,
                module=module,
                priority=priority,
                description=description,
                status="ABIERTO",
                reporter_id=int(current_user["id"]),
                reporter_tenant_id=int(current_user["tenant"]["id"]),
                created_at=now,
                updated_at=now,
            )
            self.db.add(ticket)
            try:
                await self.db.flush()
                self.db.add(
                    self._audit(
                        current_user,
                        "TICKET_CREATED",
                        ticket.code,
                        new_value={
                            "actor": actor,
                            "category": category,
                            "priority": priority,
                            "subject": subject,
                        },
                    )
                )
                await self.db.commit()
            except IntegrityError:
                await self.db.rollback()
                continue
            await self.db.refresh(ticket)
            return self._serialize(ticket, [])

        raise AdminOpsError(
            CODE_GENERATION_FAILED,
            "No se pudo generar un código único de ticket tras varios intentos.",
        )

    async def list_my_tickets(self, current_user: dict) -> list[dict]:
        """Tickets del usuario o de su organización, más recientes primero."""
        tenant = current_user.get("tenant") or {}
        conditions = [SupportTicket.reporter_id == current_user.get("id")]
        if tenant.get("id") is not None:
            conditions.append(
                SupportTicket.reporter_tenant_id == tenant["id"]
            )
        stmt = (
            select(SupportTicket)
            .where(or_(*conditions))
            .order_by(SupportTicket.created_at.desc())
        )
        tickets = (await self.db.execute(stmt)).scalars().all()
        return [self._serialize(ticket, []) for ticket in tickets]

    async def list_tickets(
        self,
        current_user: dict,
        status: str | None = None,
        category: str | None = None,
        q: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        """Bandeja administrativa completa con filtros y paginación."""
        self._assert_platform_admin(current_user)

        page = max(int(page or 1), 1)
        limit = min(max(int(limit or 20), 1), 100)

        conditions = []
        if status:
            conditions.append(SupportTicket.status == str(status).strip().upper())
        if category:
            conditions.append(
                SupportTicket.category == str(category).strip().upper()
            )
        if q and str(q).strip():
            term = f"%{str(q).strip()}%"
            conditions.append(
                or_(
                    SupportTicket.code.ilike(term),
                    SupportTicket.subject.ilike(term),
                    SupportTicket.description.ilike(term),
                )
            )

        total = (
            await self.db.execute(
                select(func.count())
                .select_from(SupportTicket)
                .where(*conditions)
            )
        ).scalar() or 0
        stmt = (
            select(SupportTicket)
            .where(*conditions)
            .order_by(SupportTicket.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        tickets = (await self.db.execute(stmt)).scalars().all()
        return {
            "total": int(total),
            "page": page,
            "limit": limit,
            "items": [self._serialize(ticket, []) for ticket in tickets],
        }

    async def _messages_for(self, ticket_id: int) -> list[SupportTicketMessage]:
        stmt = (
            select(SupportTicketMessage)
            .where(SupportTicketMessage.ticket_id == ticket_id)
            .order_by(SupportTicketMessage.created_at.asc())
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def get_ticket(self, current_user: dict, ticket_id: int) -> dict:
        """Detalle de un ticket: PLATFORM_ADMIN o su propio reporter."""
        ticket = await self.db.get(SupportTicket, ticket_id)
        is_admin = (current_user.get("rol") or {}).get("codigo") == (
            "PLATFORM_ADMIN"
        )
        if ticket is None or (
            not is_admin and ticket.reporter_id != current_user.get("id")
        ):
            raise AdminOpsError(
                TICKET_NOT_FOUND, "El ticket solicitado no existe."
            )
        messages = await self._messages_for(int(ticket.id))
        return self._serialize(ticket, messages)

    async def update_ticket(
        self, current_user: dict, ticket_id: int, payload: dict
    ) -> dict:
        """Actualiza estado, responsable y respuestas de auditoría admin."""
        self._assert_platform_admin(current_user)

        ticket = await self.db.get(SupportTicket, ticket_id)
        if ticket is None:
            raise AdminOpsError(
                TICKET_NOT_FOUND, "El ticket solicitado no existe."
            )

        now = utcnow_naive()

        new_status = payload.get("status")
        if new_status is not None:
            new_status = str(new_status).strip().upper()
            if new_status not in STATUSES:
                raise AdminOpsError(
                    VALIDATION_ERROR,
                    f"Estado inválido: {new_status}. Válidos: {sorted(STATUSES)}.",
                )

        reply = payload.get("reply")
        if reply is not None:
            reply = str(reply).strip()
            if not reply:
                raise AdminOpsError(
                    VALIDATION_ERROR, "La respuesta no puede estar vacía."
                )
            if ticket.status == "CERRADO":
                raise AdminOpsError(
                    TICKET_CLOSED,
                    "Un ticket CERRADO no admite respuestas; reabralo primero.",
                )

        assigned_to_id = payload.get("assigned_to_id")
        if assigned_to_id is not None:
            try:
                assigned_to_id = int(assigned_to_id)
            except (TypeError, ValueError) as exc:
                raise AdminOpsError(
                    VALIDATION_ERROR,
                    "assigned_to_id debe ser un identificador numérico válido.",
                ) from exc

        if new_status is not None and new_status != ticket.status:
            previous_status = ticket.status
            if previous_status == "CERRADO" and new_status in REOPENED_STATUSES:
                ticket.closed_at = None
                self.db.add(
                    self._audit(
                        current_user,
                        "TICKET_REOPENED",
                        ticket.code,
                        old_value={"status": previous_status},
                        new_value={"status": new_status},
                    )
                )
            else:
                self.db.add(
                    self._audit(
                        current_user,
                        "TICKET_STATUS_CHANGED",
                        ticket.code,
                        old_value={"status": previous_status},
                        new_value={"status": new_status},
                    )
                )
            ticket.status = new_status
            if new_status == "CERRADO":
                ticket.closed_at = now

        if (
            assigned_to_id is not None
            and assigned_to_id != ticket.assigned_to_id
        ):
            previous_assignee = ticket.assigned_to_id
            ticket.assigned_to_id = assigned_to_id
            self.db.add(
                self._audit(
                    current_user,
                    "TICKET_ASSIGNED",
                    ticket.code,
                    old_value={"assigned_to_id": previous_assignee},
                    new_value={"assigned_to_id": assigned_to_id},
                )
            )

        if reply is not None:
            self.db.add(
                SupportTicketMessage(
                    ticket_id=int(ticket.id),
                    author_id=int(current_user["id"]),
                    body=reply,
                    created_at=now,
                )
            )
            self.db.add(
                self._audit(
                    current_user,
                    "TICKET_REPLIED",
                    ticket.code,
                    new_value={
                        "author_id": current_user.get("id"),
                        "excerpt": reply[:200],
                    },
                )
            )

        ticket.updated_at = now
        await self.db.commit()
        await self.db.refresh(ticket)
        messages = await self._messages_for(int(ticket.id))
        return self._serialize(ticket, messages)
