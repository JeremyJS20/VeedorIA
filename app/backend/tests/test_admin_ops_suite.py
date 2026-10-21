import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.audit_log import AuditLog
from src.models.auth import AppUser
from src.models.detection_config import DetectionConfig
from src.models.sync_log import SyncLog
from src.models.user import User
from src.services.auth_service import ensure_auth_seed

PASSWORD = "VeedorIA2026!"  # noqa: S105 (credencial sembrada por ensure_auth_seed)
ADMIN_EMAIL = "admin@veedoria.gob.do"
AUDITOR_EMAIL = "auditor@minerd.gob.do"


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
