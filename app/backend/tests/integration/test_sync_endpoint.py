import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.sync_log import SyncLog
from src.services.auth_service import ensure_auth_seed

PASSWORD = "VeedorIA2026!"  # noqa: S105 (credencial sembrada por ensure_auth_seed)
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


class TestSyncTriggerAuth:
    """El disparo manual de ingesta quedó reservado a PLATFORM_ADMIN."""

    async def test_requires_authentication(self, client: AsyncClient):
        response = await client.post("/api/sync/dgcp")

        assert response.status_code == 401

    async def test_rejects_non_platform_admin(self, client: AsyncClient, seeded: None):
        headers = await _login(client, AUDITOR_EMAIL)

        response = await client.post("/api/sync/dgcp", headers=headers)

        assert response.status_code == 403
        assert (
            response.json()["detail"]["code"] == "FORBIDDEN_INSUFFICIENT_ROLE_OR_PLAN"
        )



class TestSyncStatusEndpoint:
    async def test_empty_status(self, client: AsyncClient):
        response = await client.get("/api/sync/status")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["success"] is True
        assert json_data["data"]["last_sync"] is None
        assert json_data["data"]["recent_syncs"] == []

    async def test_with_sync_logs(self, client: AsyncClient, db_session: AsyncSession):
        log1 = SyncLog(status="completed", records_synced=100, triggered_by="cli")
        log2 = SyncLog(status="running", records_synced=0, triggered_by="api")
        db_session.add_all([log1, log2])
        await db_session.commit()

        response = await client.get("/api/sync/status")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["success"] is True
        data = json_data["data"]
        assert data["recent_syncs"] is not None
        assert len(data["recent_syncs"]) >= 2
        assert data["last_sync"]["status"] == "completed"
        assert data["last_sync"]["records"] == 100


class TestHealthEndpoint:
    async def test_health(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["status"] == "ok"
