import hashlib
from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.audit_log import AuditLog
from src.models.auth import AppUser
from src.models.detection_config import DetectionConfig
from src.models.sync_log import SyncLog
from src.models.user import User
from src.services.auth_service import ensure_auth_seed

PASSWORD = "VeedorIA2026!"  # noqa: S105 (credencial sembrada por ensure_auth_seed)
ADMIN_EMAIL = "admin@veedoria.gob.do"
AUDITOR_EMAIL = "auditor@minerd.gob.do"
MOPC_EMAIL = "auditor@mopc.gob.do"
HEALTH_KEYS = [
    "api",
    "database",
    "redis_worker",
    "last_sync",
    "last_detection",
    "scheduler",
]



async def _login(client: AsyncClient, correo: str) -> dict:
    response = await client.post(
        "/api/auth/login", json={"correo": correo, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['data']['access_token']}"}


@pytest.fixture(name="seeded")
async def seeded_fixture(db_session: AsyncSession) -> None:
    await ensure_auth_seed(db_session)
    # audit_log.user_id apunta a la tabla legacy `user` (FK histórica).
    users = (await db_session.execute(select(AppUser))).scalars().all()
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


async def test_admin_endpoints_reject_non_platform_admin(
    client: AsyncClient, seeded: None
):
    headers = await _login(client, AUDITOR_EMAIL)

    overview = await client.get("/api/admin/sync/overview", headers=headers)
    assert overview.status_code == 403
    assert overview.json()["code"] == "FORBIDDEN_ADMIN"

    config = await client.get("/api/admin/detection-config", headers=headers)
    assert config.status_code == 403
    assert config.json()["code"] == "FORBIDDEN_ADMIN"


async def test_sync_overview_returns_kpis_and_history(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    db_session.add(
        SyncLog(
            process_type="sync",
            status="completed",
            records_synced=120,
            sync_type="full",
        )
    )
    db_session.add(
        SyncLog(process_type="detection", status="completed", records_synced=7)
    )
    await db_session.commit()

    headers = await _login(client, ADMIN_EMAIL)
    response = await client.get("/api/admin/sync/overview", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert set(data) == {"kpis", "syncs", "detections"}
    assert data["kpis"]["records_total"] == 120
    assert data["kpis"]["failures_24h"] == 0
    assert data["kpis"]["running"] is None
    assert len(data["syncs"]) == 1
    assert data["syncs"][0]["sync_type"] == "full"
    assert len(data["detections"]) == 1


async def test_trigger_sync_enqueues_and_respects_mutex(
    client: AsyncClient,
    db_session: AsyncSession,
    seeded: None,
    monkeypatch: pytest.MonkeyPatch,
):
    calls: dict = {}

    async def fake_run_sync(**kwargs) -> str:
        calls.update(kwargs)
        return "job-sync-1"

    monkeypatch.setattr("src.services.admin_sync_service.run_sync", fake_run_sync)
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.post(
        "/api/admin/sync/trigger",
        headers=headers,
        json={"full": True, "skip_suppliers": True, "days_back": 30},
    )

    assert response.status_code == 202
    data = response.json()["data"]
    assert data["task"] == "job-sync-1"
    assert data["sync_type"] == "institutions+processes+contracts+items"
    assert calls["full"] is True
    assert calls["skip_suppliers"] is True
    assert calls["days_back"] == 30
    assert calls["rate_limit"] == 5.0

    db_session.add(SyncLog(process_type="sync", status="running"))
    await db_session.commit()

    blocked = await client.post(
        "/api/admin/sync/trigger", headers=headers, json={}
    )
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "SYNC_ALREADY_RUNNING"


async def test_queue_status_degrades_without_redis(
    client: AsyncClient, seeded: None, monkeypatch: pytest.MonkeyPatch
):
    async def broken_pool():
        raise ConnectionError("redis unreachable")

    monkeypatch.setattr(
        "src.services.admin_sync_service.get_arq_pool", broken_pool
    )
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.get("/api/admin/queue/status", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["redis"] == "OFFLINE"
    assert data["worker"] == "DOWN"
    assert data["queue_depth"] == 0
    assert data["failed_jobs_24h"] == 0
    assert data["checked_at"]


async def test_detection_config_clamp_is_audited(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.get("/api/admin/detection-config", headers=headers)
    assert response.status_code == 200
    parameters = response.json()["data"]["parameters"]
    assert len(parameters) == 13
    assert {"key", "min", "max", "step", "default_value", "updated_at"} <= set(
        parameters[0]
    )

    updated = await client.put(
        "/api/admin/detection-config",
        headers=headers,
        json={"parameters": {"THRESHOLD_CD_DOP": 5_000_000}},
    )
    assert updated.status_code == 200
    payload = updated.json()["data"]
    assert payload["adjusted"]["THRESHOLD_CD_DOP"] == {
        "requested": 5_000_000.0,
        "applied": 1_000_000.0,
    }
    cd_param = next(
        item for item in payload["parameters"] if item["key"] == "THRESHOLD_CD_DOP"
    )
    assert cd_param["value"] == 1_000_000.0

    stored = await db_session.get(DetectionConfig, "THRESHOLD_CD_DOP")
    assert stored is not None
    assert stored.value == 1_000_000.0

    logs = (
        await db_session.execute(
            select(AuditLog).where(
                AuditLog.action_type == "UPDATE_DETECTION_CONFIG"
            )
        )
    ).scalars().all()
    assert len(logs) == 1
    assert logs[0].old_value == {"THRESHOLD_CD_DOP": 250000.0}
    assert logs[0].new_value["parameters"] == {"THRESHOLD_CD_DOP": 1_000_000.0}
    assert logs[0].timestamp.tzinfo is None


async def test_detection_config_reset_restores_default(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)
    await client.put(
        "/api/admin/detection-config",
        headers=headers,
        json={"parameters": {"THRESHOLD_CM_DOP": 900_000}},
    )

    reset = await client.post(
        "/api/admin/detection-config/reset",
        headers=headers,
        json={"keys": ["THRESHOLD_CM_DOP"]},
    )

    assert reset.status_code == 200
    payload = reset.json()["data"]
    assert payload["reset"] == ["THRESHOLD_CM_DOP"]
    cm_param = next(
        item for item in payload["parameters"] if item["key"] == "THRESHOLD_CM_DOP"
    )
    assert cm_param["value"] == cm_param["default_value"] == 1_650_000.0

    logs = (
        await db_session.execute(
            select(AuditLog).where(
                AuditLog.action_type == "DETECTION_CONFIG_RESET"
            )
        )
    ).scalars().all()
    assert len(logs) == 1
    assert logs[0].new_value["keys"] == ["THRESHOLD_CM_DOP"]


async def test_calibration_analysis_reports_insufficient_data(
    client: AsyncClient, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.get("/api/admin/calibration/analysis", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["generated_at"]
    assert [item["anomaly_type"] for item in data["types"]] == [
        "PRICE_ANOMALY",
        "FRAGMENTATION",
        "COLLUSION",
    ]
    assert data["insufficient_data"] == [
        "PRICE_ANOMALY",
        "FRAGMENTATION",
        "COLLUSION",
    ]
    assert all(item["reviews"] == 0 for item in data["types"])


async def test_detection_run_enqueues_job(
    client: AsyncClient, seeded: None, monkeypatch: pytest.MonkeyPatch
):
    async def fake_run_detection() -> str:
        return "job-detection-1"

    monkeypatch.setattr(
        "src.services.admin_calibration_service.run_detection", fake_run_detection
    )
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.post("/api/admin/detection/run", headers=headers)

    assert response.status_code == 202
    assert response.json()["data"]["task"] == "job-detection-1"


# ── Task 2.3: bitácora y exportación ───────────────────────────────────────
async def _user_id(db_session: AsyncSession, correo: str) -> int:
    user = (
        await db_session.execute(select(AppUser).where(AppUser.correo == correo))
    ).scalars().first()
    assert user is not None and user.id is not None
    return user.id


def _seed_audit_log(db_session: AsyncSession, admin_id: int, **overrides) -> None:
    data = {
        "action_type": "TICKET_CREATED",
        "user_id": str(admin_id),
        "entity_type": "support_ticket",
        "entity_id": "SUP-2026-0001",
        "old_value": None,
        "new_value": {"subject": "No veo la bitácora"},
        "ip_address": "10.0.0.1",
        "timestamp": datetime(2026, 1, 10, 9, 0, 0),
    }
    data.update(overrides)
    db_session.add(AuditLog(**data))


async def _audit_logs(db_session: AsyncSession) -> list[AuditLog]:
    return list((await db_session.execute(select(AuditLog))).scalars().all())


async def test_audit_logs_filters_pagination_and_guards(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    admin_id = await _user_id(db_session, ADMIN_EMAIL)
    _seed_audit_log(db_session, admin_id)
    _seed_audit_log(
        db_session,
        admin_id,
        action_type="UPDATE_DETECTION_CONFIG",
        entity_type="detection_config",
        entity_id="THRESHOLD_CD_DOP",
        old_value={"THRESHOLD_CD_DOP": 250_000.0},
        new_value={"THRESHOLD_CD_DOP": 1_000_000.0},
        timestamp=datetime(2026, 1, 15, 9, 0, 0),
    )
    _seed_audit_log(
        db_session,
        admin_id,
        action_type="TICKET_REPLIED",
        entity_id="SUP-2026-0002",
        timestamp=datetime(2026, 1, 20, 23, 30, 0),
    )
    await db_session.commit()
    headers = await _login(client, ADMIN_EMAIL)

    first_page = await client.get(
        "/api/admin/audit-logs?limit=2&page=1", headers=headers
    )
    assert first_page.status_code == 200
    data = first_page.json()["data"]
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["limit"] == 2
    assert len(data["items"]) == 2
    timestamps = [item["timestamp"] for item in data["items"]]
    assert timestamps == sorted(timestamps, reverse=True)
    assert data["items"][0]["user_email"] == ADMIN_EMAIL
    assert set(data["items"][0]) == {
        "id",
        "action_type",
        "user_id",
        "user_email",
        "entity_type",
        "entity_id",
        "old_value",
        "new_value",
        "ip_address",
        "timestamp",
    }

    second_page = await client.get(
        "/api/admin/audit-logs?limit=2&page=2", headers=headers
    )
    assert second_page.status_code == 200
    assert len(second_page.json()["data"]["items"]) == 1

    by_action = await client.get(
        "/api/admin/audit-logs?action_type=TICKET_REPLIED", headers=headers
    )
    assert by_action.json()["data"]["total"] == 1
    assert by_action.json()["data"]["items"][0]["entity_id"] == "SUP-2026-0002"

    by_entity = await client.get(
        "/api/admin/audit-logs?entity_type=detection_config"
        "&entity_id=THRESHOLD_CD_DOP",
        headers=headers,
    )
    assert by_entity.json()["data"]["total"] == 1

    by_range = await client.get(
        "/api/admin/audit-logs?date_from=2026-01-15&date_to=2026-01-20",
        headers=headers,
    )
    assert by_range.json()["data"]["total"] == 2

    start_of_last = await client.get(
        "/api/admin/audit-logs?date_from=2026-01-20&date_to=2026-01-20",
        headers=headers,
    )
    assert start_of_last.json()["data"]["total"] == 1

    invalid_range = await client.get(
        "/api/admin/audit-logs?date_from=2026-02-01&date_to=2026-01-01",
        headers=headers,
    )
    assert invalid_range.status_code == 422
    assert invalid_range.json()["code"] == "INVALID_DATE_RANGE"

    invalid_date = await client.get(
        "/api/admin/audit-logs?date_from=ayer", headers=headers
    )
    assert invalid_date.status_code == 422
    assert invalid_date.json()["code"] == "VALIDATION_ERROR"

    forbidden = await _login(client, AUDITOR_EMAIL)
    blocked = await client.get("/api/admin/audit-logs", headers=forbidden)
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "FORBIDDEN_ADMIN"


async def test_export_audit_logs_csv_is_checksummed_and_audited(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    admin_id = await _user_id(db_session, ADMIN_EMAIL)
    _seed_audit_log(db_session, admin_id)
    _seed_audit_log(
        db_session,
        admin_id,
        action_type="SYNC_TRIGGERED",
        entity_type="sync",
        entity_id="job-sync-1",
        new_value={"full": True, "days_back": 90},
        timestamp=datetime(2026, 1, 12, 7, 0, 0),
    )
    await db_session.commit()
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.get(
        "/api/admin/audit-logs/export?format=csv", headers=headers
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    checksum = response.headers["x-checksum-sha256"]
    assert len(checksum) == 64
    assert int(checksum, 16) >= 0
    assert checksum == hashlib.sha256(response.text.encode("utf-8")).hexdigest()
    disposition = response.headers["content-disposition"]
    assert disposition.startswith("attachment; filename=")
    assert disposition.endswith('.csv"')

    lines = response.text.strip().splitlines()
    assert lines[0].split(",") == [
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
    ]
    assert len(lines) == 3
    assert "TICKET_CREATED" in response.text
    assert ADMIN_EMAIL in response.text

    export_logs = [
        log
        for log in await _audit_logs(db_session)
        if log.action_type == "AUDIT_LOG_EXPORT"
    ]
    assert len(export_logs) == 1
    audit_row = export_logs[0]
    assert audit_row.new_value["format"] == "csv"
    assert audit_row.new_value["rows"] == 2
    assert audit_row.new_value["checksum_sha256"] == checksum
    assert audit_row.new_value["filters"] == {}
    assert audit_row.entity_type == "audit_log"
    assert audit_row.timestamp.tzinfo is None

    as_json = await client.get(
        "/api/admin/audit-logs/export?format=json&action_type=SYNC_TRIGGERED",
        headers=headers,
    )
    assert as_json.status_code == 200
    assert as_json.headers["content-type"].startswith("application/json")
    payload = as_json.json()
    assert len(payload) == 1
    assert payload[0]["entity_id"] == "job-sync-1"
    assert as_json.headers["x-checksum-sha256"] == hashlib.sha256(
        as_json.text.encode("utf-8")
    ).hexdigest()

    bad_format = await client.get(
        "/api/admin/audit-logs/export?format=xml", headers=headers
    )
    assert bad_format.status_code == 422

    forbidden = await _login(client, AUDITOR_EMAIL)
    blocked = await client.get(
        "/api/admin/audit-logs/export?format=csv", headers=forbidden
    )
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "FORBIDDEN_ADMIN"


async def test_audit_logs_endpoint_is_read_only(
    client: AsyncClient, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)

    for method in ("post", "put", "patch", "delete"):
        response = await getattr(client, method)(
            "/api/admin/audit-logs", headers=headers
        )
        assert response.status_code == 405, method
        response_export = await getattr(client, method)(
            "/api/admin/audit-logs/export", headers=headers
        )
        assert response_export.status_code == 405, method


# ── Task 2.4: health de servicios ──────────────────────────────────────────
async def test_services_health_isolates_redis_failure(
    client: AsyncClient,
    db_session: AsyncSession,
    seeded: None,
    monkeypatch: pytest.MonkeyPatch,
):
    db_session.add(
        SyncLog(process_type="sync", status="completed", records_synced=42)
    )
    db_session.add(
        SyncLog(process_type="detection", status="completed", records_synced=5)
    )
    await db_session.commit()

    async def broken_pool():
        raise ConnectionError("redis unreachable")

    monkeypatch.setattr(
        "src.services.admin_sync_service.get_arq_pool", broken_pool
    )
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.get("/api/admin/health/services", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["checked_at"]
    components = data["components"]
    assert [component["key"] for component in components] == HEALTH_KEYS
    assert all(
        {"key", "label", "status", "detail", "latency_ms"} <= set(component)
        for component in components
    )
    statuses = {component["key"]: component["status"] for component in components}
    assert statuses["redis_worker"] == "DOWN"
    assert [key for key, value in statuses.items() if value == "DOWN"] == [
        "redis_worker"
    ]
    assert statuses["api"] == "OK"
    assert statuses["database"] == "OK"
    assert statuses["last_sync"] == "OK"
    assert statuses["last_detection"] == "OK"
    assert statuses["scheduler"] in {"OK", "DEGRADED"}
    assert all(component["latency_ms"] >= 0 for component in components)


# ── Task 2.4: tickets de autoservicio y bandeja admin ──────────────────────
def _ticket_payload(**overrides) -> dict:
    data = {
        "subject": "No puedo ver la bitácora",
        "description": "Al entrar a /app/bitacora la tabla queda vacía.",
        "category": "SOPORTE_FUNCIONAL",
        "module": "BITACORA",
        "priority": "MEDIA",
    }
    data.update(overrides)
    return data


async def test_self_service_tickets_are_scoped_to_the_owner(
    client: AsyncClient, seeded: None
):
    owner = await _login(client, AUDITOR_EMAIL)
    created = await client.post(
        "/api/support/tickets", headers=owner, json=_ticket_payload()
    )

    assert created.status_code == 201
    ticket = created.json()["data"]
    assert ticket["code"] == f"SUP-{utcnow_naive().year}-0001"
    assert ticket["status"] == "ABIERTO"
    assert ticket["messages"] == []

    mine = await client.get("/api/support/tickets", headers=owner)
    assert mine.status_code == 200
    assert [item["code"] for item in mine.json()["data"]] == [ticket["code"]]

    other_tenant = await _login(client, MOPC_EMAIL)
    foreign_list = await client.get("/api/support/tickets", headers=other_tenant)
    assert foreign_list.status_code == 200
    assert foreign_list.json()["data"] == []

    foreign_detail = await client.get(
        f"/api/support/tickets/{ticket['id']}", headers=other_tenant
    )
    assert foreign_detail.status_code == 404
    assert foreign_detail.json()["code"] == "TICKET_NOT_FOUND"

    own_detail = await client.get(
        f"/api/support/tickets/{ticket['id']}", headers=owner
    )
    assert own_detail.status_code == 200
    assert own_detail.json()["data"]["code"] == ticket["code"]

    empty_subject = await client.post(
        "/api/support/tickets",
        headers=owner,
        json=_ticket_payload(subject="   "),
    )
    assert empty_subject.status_code == 422
    assert empty_subject.json()["code"] == "VALIDATION_ERROR"

    empty_description = await client.post(
        "/api/support/tickets",
        headers=owner,
        json=_ticket_payload(description=""),
    )
    assert empty_description.status_code == 422
    assert empty_description.json()["code"] == "VALIDATION_ERROR"


async def test_admin_ticket_inbox_assignment_reply_and_close(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    minerd = await _login(client, AUDITOR_EMAIL)
    mopc = await _login(client, MOPC_EMAIL)

    minerd_ticket = (
        await client.post(
            "/api/support/tickets", headers=minerd, json=_ticket_payload()
        )
    ).json()["data"]
    mopc_ticket = (
        await client.post(
            "/api/support/tickets",
            headers=mopc,
            json=_ticket_payload(subject="Error al calibrar umbrales"),
        )
    ).json()["data"]

    headers = await _login(client, ADMIN_EMAIL)
    inbox = await client.get("/api/admin/support/tickets", headers=headers)
    assert inbox.status_code == 200
    assert inbox.json()["data"]["total"] == 2

    searched = await client.get(
        "/api/admin/support/tickets?q=calibrar&status=ABIERTO", headers=headers
    )
    assert searched.json()["data"]["total"] == 1
    assert searched.json()["data"]["items"][0]["code"] == mopc_ticket["code"]

    assignee_id = await _user_id(db_session, MOPC_EMAIL)
    updated = await client.patch(
        f"/api/admin/support/tickets/{minerd_ticket['id']}",
        headers=headers,
        json={
            "status": "EN_PROGRESO",
            "assigned_to_id": assignee_id,
            "reply": "Estamos revisando el caso.",
        },
    )
    assert updated.status_code == 200
    detail = updated.json()["data"]
    assert detail["status"] == "EN_PROGRESO"
    assert detail["assigned_to_id"] == assignee_id
    assert len(detail["messages"]) == 1
    assert detail["messages"][0]["body"] == "Estamos revisando el caso."

    fetched = await client.get(
        f"/api/admin/support/tickets/{minerd_ticket['id']}", headers=headers
    )
    assert fetched.status_code == 200
    assert fetched.json()["data"]["code"] == minerd_ticket["code"]

    action_types = {
        log.action_type for log in await _audit_logs(db_session)
    }
    assert {"TICKET_ASSIGNED", "TICKET_REPLIED"} <= action_types

    closed = await client.patch(
        f"/api/admin/support/tickets/{minerd_ticket['id']}",
        headers=headers,
        json={"status": "CERRADO"},
    )
    assert closed.status_code == 200
    assert closed.json()["data"]["closed_at"]

    blocked = await client.patch(
        f"/api/admin/support/tickets/{minerd_ticket['id']}",
        headers=headers,
        json={"reply": "¿Sigue disponible?"},
    )
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "TICKET_CLOSED"

    empty_patch = await client.patch(
        f"/api/admin/support/tickets/{minerd_ticket['id']}",
        headers=headers,
        json={},
    )
    assert empty_patch.status_code == 422
    assert empty_patch.json()["code"] == "VALIDATION_ERROR"

    missing = await client.patch(
        "/api/admin/support/tickets/999999", headers=headers, json={"reply": "hola"}
    )
    assert missing.status_code == 404
    assert missing.json()["code"] == "TICKET_NOT_FOUND"


async def test_admin_health_and_support_require_platform_admin(
    client: AsyncClient, seeded: None
):
    headers = await _login(client, AUDITOR_EMAIL)

    health = await client.get("/api/admin/health/services", headers=headers)
    assert health.status_code == 403
    assert health.json()["code"] == "FORBIDDEN_ADMIN"

    inbox = await client.get("/api/admin/support/tickets", headers=headers)
    assert inbox.status_code == 403
    assert inbox.json()["code"] == "FORBIDDEN_ADMIN"

    patched = await client.patch(
        "/api/admin/support/tickets/1", headers=headers, json={"status": "CERRADO"}
    )
    assert patched.status_code == 403
    assert patched.json()["code"] == "FORBIDDEN_ADMIN"


# ── Regresión: timestamps naive en toda la bitácora ────────────────────────
async def test_audit_logs_keep_naive_utc_timestamps(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)
    ticket = (
        await client.post(
            "/api/support/tickets", headers=headers, json=_ticket_payload()
        )
    ).json()["data"]

    await client.patch(
        f"/api/admin/support/tickets/{ticket['id']}",
        headers=headers,
        json={"status": "EN_PROGRESO", "reply": "Revisando."},
    )
    await client.get("/api/admin/audit-logs/export?format=json", headers=headers)

    logs = await _audit_logs(db_session)
    assert logs
    assert all(log.timestamp.tzinfo is None for log in logs)
    action_types = {log.action_type for log in logs}
    assert {
        "TICKET_CREATED",
        "TICKET_STATUS_CHANGED",
        "TICKET_REPLIED",
        "AUDIT_LOG_EXPORT",
    } <= action_types


# ── Wave 4: cobertura de calibración aplicada, mutex de detección y reapertura ─
async def test_calibration_apply_clamps_and_audits(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)

    response = await client.post(
        "/api/admin/calibration/apply",
        headers=headers,
        json={
            "changes": {
                "price_zscore_threshold": 9.9,
                "fragmentation_threshold_dop": 1000,
            }
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied"]["price_zscore_threshold"] == 4.0
    assert data["applied"]["fragmentation_threshold_dop"] == 3_000_000.0
    assert data["adjusted"]["price_zscore_threshold"] == {
        "requested": 9.9,
        "applied": 4.0,
    }
    assert data["adjusted"]["fragmentation_threshold_dop"] == {
        "requested": 1000.0,
        "applied": 3_000_000.0,
    }

    db_session.expire_all()
    rows = {
        row.key: row
        for row in (await db_session.execute(select(DetectionConfig))).scalars()
    }
    assert float(rows["price_zscore_threshold"].value) == 4.0
    assert float(rows["fragmentation_threshold_dop"].value) == 3_000_000.0

    logs = await _audit_logs(db_session)
    applied_logs = [log for log in logs if log.action_type == "CALIBRATION_APPLY"]
    assert applied_logs
    latest = applied_logs[-1]
    assert latest.timestamp.tzinfo is None
    assert latest.new_value["parameters"]["price_zscore_threshold"] == 4.0

    rejected = await client.post(
        "/api/admin/calibration/apply",
        headers=headers,
        json={"changes": {"unknown_threshold": 1.0}},
    )
    assert rejected.status_code == 422
    assert rejected.json()["code"] == "VALIDATION_ERROR"

    empty = await client.post(
        "/api/admin/calibration/apply", headers=headers, json={"changes": {}}
    )
    assert empty.status_code == 422
    assert empty.json()["code"] == "VALIDATION_ERROR"


async def test_detection_run_respects_mutex(
    client: AsyncClient,
    db_session: AsyncSession,
    seeded: None,
    monkeypatch: pytest.MonkeyPatch,
):
    async def unexpected_run() -> str:
        raise AssertionError("run_detection no debe invocarse con una corrida activa")

    monkeypatch.setattr(
        "src.services.admin_calibration_service.run_detection", unexpected_run
    )
    headers = await _login(client, ADMIN_EMAIL)

    db_session.add(SyncLog(process_type="detection", status="running"))
    await db_session.commit()

    response = await client.post("/api/admin/detection/run", headers=headers)

    assert response.status_code == 409
    assert response.json()["code"] == "DETECTION_ALREADY_RUNNING"


async def test_export_audit_logs_json_matches_checksum(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    headers = await _login(client, ADMIN_EMAIL)
    admin_id = await _user_id(db_session, ADMIN_EMAIL)
    _seed_audit_log(db_session, admin_id, action_type="CALIBRATION_APPLY")
    await db_session.commit()

    response = await client.get(
        "/api/admin/audit-logs/export?format=json", headers=headers
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.headers["x-checksum-sha256"] == hashlib.sha256(
        response.content
    ).hexdigest()
    payload = response.json()
    assert isinstance(payload, list) and payload
    assert {"id", "action_type", "timestamp"} <= set(payload[0])

    logs = await _audit_logs(db_session)
    export_logs = [log for log in logs if log.action_type == "AUDIT_LOG_EXPORT"]
    assert export_logs[-1].new_value["format"] == "json"


async def test_ticket_reopen_clears_closed_at_and_is_audited(
    client: AsyncClient, db_session: AsyncSession, seeded: None
):
    requester = await _login(client, AUDITOR_EMAIL)
    ticket = (
        await client.post(
            "/api/support/tickets", headers=requester, json=_ticket_payload()
        )
    ).json()["data"]

    headers = await _login(client, ADMIN_EMAIL)

    closed = await client.patch(
        f"/api/admin/support/tickets/{ticket['id']}",
        headers=headers,
        json={"status": "CERRADO"},
    )
    assert closed.status_code == 200
    assert closed.json()["data"]["closed_at"]

    reopened = await client.patch(
        f"/api/admin/support/tickets/{ticket['id']}",
        headers=headers,
        json={"status": "EN_PROGRESO"},
    )
    assert reopened.status_code == 200
    data = reopened.json()["data"]
    assert data["status"] == "EN_PROGRESO"
    assert data["closed_at"] is None

    action_types = {log.action_type for log in await _audit_logs(db_session)}
    assert "TICKET_REOPENED" in action_types


