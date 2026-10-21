import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.auth import AppUser
from src.models.user import User
from src.services.auth_service import ensure_auth_seed

PASSWORD = "VeedorIA2026!"  # noqa: S105 (credencial sembrada por ensure_auth_seed)
AUDITOR_EMAIL = "auditor@minerd.gob.do"
PROVEEDOR_EMAIL = "proveedor@constructora.do"
FAKE_REVIEWER_ID = "00000000-0000-0000-0000-000000000000"


async def _login(client: AsyncClient, correo: str) -> dict:
    response = await client.post(
        "/api/auth/login", json={"correo": correo, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['data']['access_token']}"}


@pytest.fixture(name="seeded")
async def seeded_fixture(db_session: AsyncSession) -> None:
    """Siembra RBAC y espeja las cuentas en la tabla legacy `user`.

    `anomaly.reviewer_id` tiene FK a `user.id` y el revisor ahora sale del token
    (`AppUser`), así que su fila equivalente debe existir para satisfacer la FK.
    """
    await ensure_auth_seed(db_session)
    app_users = (await db_session.execute(select(AppUser))).scalars().all()
    for app_user in app_users:
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


async def _auditor_id(db_session: AsyncSession) -> str:
    auditor = (
        await db_session.execute(select(AppUser).where(AppUser.correo == AUDITOR_EMAIL))
    ).scalar_one()
    return str(auditor.id)


async def _new_anomaly(db_session: AsyncSession, **overrides) -> Anomaly:
    anomaly = Anomaly(
        anomaly_type=overrides.get("anomaly_type", "PRICE_ANOMALY"),
        severity=overrides.get("severity", 0.8),
        description=overrides.get("description", "Sobreprecio en laptops"),
    )
    db_session.add(anomaly)
    await db_session.commit()
    await db_session.refresh(anomaly)
    return anomaly


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
    await _new_anomaly(
        db_session,
        anomaly_type="PRICE_ANOMALY",
        severity=0.9,
        description="Precio inflado detectado",
    )

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
        await _new_anomaly(
            db_session, anomaly_type=typ, severity=0.5, description=f"{typ} test"
        )

    response = await client.get("/api/anomalies/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_by_type"]["PRICE_ANOMALY"] == 1
    assert data["data"]["total_by_type"]["FRAGMENTATION"] == 1
    assert data["data"]["avg_severity"] == 0.5


@pytest.mark.asyncio
async def test_get_anomaly_by_id(client: AsyncClient, db_session: AsyncSession):
    anomaly = await _new_anomaly(
        db_session,
        anomaly_type="COLLUSION",
        severity=0.7,
        description="Colusión entre proveedores",
    )

    response = await client.get(f"/api/anomalies/{anomaly.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == anomaly.id
    assert data["data"]["anomaly_type"] == "COLLUSION"
    assert data["data"]["status"] == "PENDING"


@pytest.mark.asyncio
async def test_get_anomaly_not_found(client: AsyncClient):
    response = await client.get(f"/api/anomalies/{uuid.uuid4()}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Anomalía no encontrada"


# ---------------------------------------------------------------------------
# Escritura: detección y dictámenes exigen token + permiso (antes eran anónimos)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_detect_requires_authentication(client: AsyncClient):
    response = await client.post("/api/anomalies/detect")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_detect_rejects_role_without_permission(
    client: AsyncClient, seeded: None
):
    headers = await _login(client, PROVEEDOR_EMAIL)

    response = await client.post("/api/anomalies/detect", headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "FORBIDDEN_INSUFFICIENT_ROLE_OR_PLAN"


@pytest.mark.asyncio
async def test_review_requires_authentication(
    client: AsyncClient, db_session: AsyncSession
):
    anomaly = await _new_anomaly(db_session)

    response = await client.patch(
        f"/api/anomalies/{anomaly.id}",
        json={
            "status": "CONFIRMED",
            "notes": "Nota de prueba de al menos 10 caracteres",
        },
    )

    assert response.status_code == 401
    await db_session.refresh(anomaly)
    assert anomaly.status == "PENDING"


@pytest.mark.asyncio
async def test_review_rejects_role_without_permission(
    client: AsyncClient, seeded: None, db_session: AsyncSession
):
    headers = await _login(client, PROVEEDOR_EMAIL)
    anomaly = await _new_anomaly(db_session)

    response = await client.patch(
        f"/api/anomalies/{anomaly.id}",
        headers=headers,
        json={
            "status": "CONFIRMED",
            "notes": "Nota de prueba de al menos 10 caracteres",
        },
    )

    assert response.status_code == 403
    await db_session.refresh(anomaly)
    assert anomaly.status == "PENDING"


@pytest.mark.asyncio
async def test_review_anomaly_confirm(
    client: AsyncClient, seeded: None, db_session: AsyncSession
):
    headers = await _login(client, AUDITOR_EMAIL)
    anomaly = await _new_anomaly(db_session)

    response = await client.patch(
        f"/api/anomalies/{anomaly.id}",
        headers=headers,
        json={
            "status": "CONFIRMED",
            # el cliente intenta imponer otro revisor: debe ser ignorado
            "reviewer_id": FAKE_REVIEWER_ID,
            "notes": "Se confirma después de revisar los precios de mercado. El precio DOP 180,000 supera en 340% la mediana.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "CONFIRMED"
    assert data["data"]["reviewer_id"] == await _auditor_id(db_session)
    assert data["data"]["reviewer_id"] != FAKE_REVIEWER_ID


@pytest.mark.asyncio
async def test_review_anomaly_dismiss(
    client: AsyncClient, seeded: None, db_session: AsyncSession
):
    headers = await _login(client, AUDITOR_EMAIL)
    anomaly = await _new_anomaly(
        db_session,
        anomaly_type="FRAGMENTATION",
        severity=0.4,
        description="Posible fraccionamiento",
    )

    response = await client.patch(
        f"/api/anomalies/{anomaly.id}",
        headers=headers,
        json={
            "status": "DISMISSED",
            "dismissal_reason": "FALSE_POSITIVE",
            "notes": "Se descarta porque los contratos pertenecen a unidades diferentes.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "DISMISSED"
    assert data["data"]["dismissal_reason"] == "FALSE_POSITIVE"


@pytest.mark.asyncio
async def test_review_anomaly_not_found(client: AsyncClient, seeded: None):
    headers = await _login(client, AUDITOR_EMAIL)

    response = await client.patch(
        f"/api/anomalies/{uuid.uuid4()}",
        headers=headers,
        json={
            "status": "CONFIRMED",
            "notes": "Nota de prueba de al menos 10 caracteres",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Anomalía no encontrada"
