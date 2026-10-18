from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.sync_log import SyncLog


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
