import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.models.auth import AppUser, Role
from src.models.support_ticket import SupportTicket
from src.models.user import User
from src.services.admin_ops_errors import (
    FORBIDDEN_ADMIN,
    TICKET_CLOSED,
    VALIDATION_ERROR,
    AdminOpsError,
)
from src.services.admin_support_service import AdminSupportService
from src.services.auth_service import ensure_auth_seed


@pytest.fixture(name="ops_users")
async def ops_users_fixture(db_session: AsyncSession) -> dict[str, dict]:
    await ensure_auth_seed(db_session)
    users = (await db_session.execute(select(AppUser))).scalars().all()
    roles = {
        role.id: role.codigo
        for role in (await db_session.execute(select(Role))).scalars().all()
    }
    # audit_log.user_id apunta a la tabla legacy `user` (FK histórica).
    for app_user in users:
        db_session.add(
            User(
                id=str(app_user.id),
                email=app_user.correo,
                password_hash=app_user.password_hash,
                full_name=app_user.nombre,
                role="ADMIN",
            )
        )
    await db_session.commit()

    by_email = {user.correo: user for user in users}

    def current_user(email: str) -> dict:
        user = by_email[email]
        return {
            "id": user.id,
            "correo": user.correo,
            "nombre": user.nombre,
            "rol": {"codigo": roles[user.role_id]},
            "tenant": {"id": user.tenant_id},
        }

    return {
        "admin": current_user("admin@veedoria.gob.do"),
        "mopc": current_user("auditor@mopc.gob.do"),
        "minerd": current_user("auditor@minerd.gob.do"),
        "proveedor": current_user("proveedor@constructora.do"),
    }


def _payload(**overrides) -> dict:
    data = {
        "subject": "No puedo ver la bitácora",
        "description": "Al entrar a /app/bitacora la tabla queda vacía.",
        "category": "SOPORTE_FUNCIONAL",
        "module": "BITACORA",
        "priority": "MEDIA",
    }
    data.update(overrides)
    return data


@pytest.mark.asyncio
async def test_create_ticket_generates_sequential_codes(
    db_session: AsyncSession, ops_users: dict[str, dict]
):
    service = AdminSupportService(db_session)
    year = utcnow_naive().year

    first = await service.create_ticket(ops_users["admin"], _payload())
    second = await service.create_ticket(
        ops_users["admin"], _payload(subject="Segundo ticket")
    )

    assert first["code"] == f"SUP-{year}-0001"
    assert second["code"] == f"SUP-{year}-0002"
    assert first["status"] == "ABIERTO"
    assert first["messages"] == []

    stored = (
        await db_session.execute(select(SupportTicket).order_by(SupportTicket.id))
    ).scalars().all()
    assert [ticket.code for ticket in stored] == [first["code"], second["code"]]
    assert all(ticket.created_at.tzinfo is None for ticket in stored)
    assert all(ticket.updated_at.tzinfo is None for ticket in stored)


@pytest.mark.asyncio
async def test_create_ticket_rejects_empty_subject(
    db_session: AsyncSession, ops_users: dict[str, dict]
):
    service = AdminSupportService(db_session)

    with pytest.raises(AdminOpsError) as error:
        await service.create_ticket(ops_users["admin"], _payload(subject="   "))

    assert error.value.code == VALIDATION_ERROR
    total = (await db_session.execute(select(SupportTicket))).scalars().all()
    assert total == []


@pytest.mark.asyncio
async def test_tenant_isolation_and_admin_guard(
    db_session: AsyncSession, ops_users: dict[str, dict]
):
    service = AdminSupportService(db_session)
    await service.create_ticket(ops_users["mopc"], _payload())

    mine_mopc = await service.list_my_tickets(ops_users["mopc"])
    mine_minerd = await service.list_my_tickets(ops_users["minerd"])
    assert len(mine_mopc) == 1
    assert mine_minerd == []

    with pytest.raises(AdminOpsError) as error:
        await service.list_tickets(ops_users["proveedor"])
    assert error.value.code == FORBIDDEN_ADMIN

    admin_inbox = await service.list_tickets(ops_users["admin"])
    assert admin_inbox["total"] == 1
    assert admin_inbox["items"][0]["code"] == mine_mopc[0]["code"]


@pytest.mark.asyncio
async def test_closed_ticket_rejects_reply_and_admin_can_reopen(
    db_session: AsyncSession, ops_users: dict[str, dict]
):
    service = AdminSupportService(db_session)
    ticket = await service.create_ticket(ops_users["admin"], _payload())
    admin = ops_users["admin"]

    closed = await service.update_ticket(admin, ticket["id"], {"status": "CERRADO"})
    assert closed["status"] == "CERRADO"
    assert closed["closed_at"] is not None

    with pytest.raises(AdminOpsError) as error:
        await service.update_ticket(admin, ticket["id"], {"reply": "¿Sigue ahí?"})
    assert error.value.code == TICKET_CLOSED

    reopened = await service.update_ticket(
        admin, ticket["id"], {"status": "EN_PROGRESO"}
    )
    assert reopened["status"] == "EN_PROGRESO"
    assert reopened["closed_at"] is None

    logs = (
        await db_session.execute(
            select(AuditLog).where(AuditLog.action_type == "TICKET_REOPENED")
        )
    ).scalars().all()
    assert len(logs) == 1
    assert logs[0].entity_type == "support_ticket"
    assert logs[0].entity_id == ticket["code"]
    assert logs[0].timestamp.tzinfo is None


@pytest.mark.asyncio
async def test_assignment_and_reply_are_audited_with_naive_timestamps(
    db_session: AsyncSession, ops_users: dict[str, dict]
):
    service = AdminSupportService(db_session)
    admin = ops_users["admin"]
    assignee_id = ops_users["mopc"]["id"]

    ticket = await service.create_ticket(admin, _payload())
    updated = await service.update_ticket(
        admin,
        ticket["id"],
        {"assigned_to_id": assignee_id, "reply": "Estamos revisando el caso."},
    )

    assert updated["assigned_to_id"] == assignee_id
    assert len(updated["messages"]) == 1
    assert updated["messages"][0]["author_id"] == admin["id"]

    logs = (
        await db_session.execute(
            select(AuditLog).where(
                AuditLog.action_type.in_(["TICKET_ASSIGNED", "TICKET_REPLIED"])
            )
        )
    ).scalars().all()
    assert {log.action_type for log in logs} == {
        "TICKET_ASSIGNED",
        "TICKET_REPLIED",
    }
    assert all(log.timestamp.tzinfo is None for log in logs)
    assert all(log.entity_id == ticket["code"] for log in logs)
