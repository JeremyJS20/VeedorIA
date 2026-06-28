import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.user import User


@pytest.fixture
def _test_user(db_session: AsyncSession) -> User:
    u = User(
        email="auditor@test.com",
        password_hash="dummy",
        full_name="Test Auditor",
        role="AUDITOR",
    )
    db_session.add(u)
    return u


@pytest.mark.asyncio
async def test_list_anomalies_empty(client: AsyncClient):
    response = await client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["items"] == []
    assert data["data"]["total"] == 0


@pytest.mark.asyncio
async def test_list_anomalies_with_data(client: AsyncClient, db_session: AsyncSession):
    a = Anomaly(
        anomaly_type="PRICE_ANOMALY",
        severity=0.9,
        score=-0.8,
        description="Precio inflado detectado",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    response = await client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) == 1
    assert data["data"]["items"][0]["anomaly_type"] == "PRICE_ANOMALY"
    assert data["data"]["items"][0]["severity"] == 0.9


@pytest.mark.asyncio
async def test_get_stats_endpoint(client: AsyncClient, db_session: AsyncSession):
    for typ in ["PRICE_ANOMALY", "FRAGMENTATION"]:
        db_session.add(Anomaly(anomaly_type=typ, severity=0.5, description=f"{typ} test"))
    await db_session.commit()

    response = await client.get("/api/anomalies/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_by_type"]["PRICE_ANOMALY"] == 1
    assert data["data"]["total_by_type"]["FRAGMENTATION"] == 1
    assert data["data"]["avg_severity"] == 0.5


@pytest.mark.asyncio
async def test_get_anomaly_by_id(client: AsyncClient, db_session: AsyncSession):
    a = Anomaly(
        anomaly_type="COLLUSION",
        severity=0.7,
        description="Colusión entre proveedores",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    response = await client.get(f"/api/anomalies/{a.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == a.id
    assert data["data"]["anomaly_type"] == "COLLUSION"
    assert data["data"]["status"] == "PENDING"


@pytest.mark.asyncio
async def test_get_anomaly_not_found(client: AsyncClient):
    response = await client.get(f"/api/anomalies/{uuid.uuid4()}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Anomalía no encontrada"


@pytest.mark.asyncio
async def test_review_anomaly_confirm(client: AsyncClient, db_session: AsyncSession):
    u = User(
        email="auditor1@test.com",
        password_hash="dummy",
        full_name="Auditor Uno",
        role="AUDITOR",
    )
    db_session.add(u)
    await db_session.flush()

    a = Anomaly(
        anomaly_type="PRICE_ANOMALY",
        severity=0.8,
        description="Sobreprecio en laptops",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    response = await client.patch(
        f"/api/anomalies/{a.id}",
        json={
            "status": "CONFIRMED",
            "reviewer_id": u.id,
            "notes": "Se confirma después de revisar los precios de mercado. El precio DOP 180,000 supera en 340% la mediana.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "CONFIRMED"
    assert data["data"]["reviewer_id"] == u.id


@pytest.mark.asyncio
async def test_review_anomaly_dismiss(client: AsyncClient, db_session: AsyncSession):
    u = User(
        email="auditor2@test.com",
        password_hash="dummy",
        full_name="Auditor Dos",
        role="AUDITOR",
    )
    db_session.add(u)
    await db_session.flush()

    a = Anomaly(
        anomaly_type="FRAGMENTATION",
        severity=0.4,
        description="Posible fraccionamiento",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    response = await client.patch(
        f"/api/anomalies/{a.id}",
        json={
            "status": "DISMISSED",
            "reviewer_id": u.id,
            "notes": "Se descarta porque los contratos pertenecen a unidades diferentes dentro de la misma institución.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "DISMISSED"


@pytest.mark.asyncio
async def test_review_anomaly_not_found(client: AsyncClient):
    response = await client.patch(
        f"/api/anomalies/{uuid.uuid4()}",
        json={
            "status": "CONFIRMED",
            "reviewer_id": "nonexistent",
            "notes": "Nota de prueba de al menos 10 caracteres",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
