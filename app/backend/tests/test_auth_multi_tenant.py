import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.auth_service import ensure_auth_seed


@pytest.mark.asyncio
async def test_login_and_me_multi_tenant_scopes(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    # 1. Login as Global Admin (NexoDigital)
    resp_admin = await client.post(
        "/api/auth/login",
        json={"correo": "admin@veedoria.gob.do", "password": "VeedorIA2026!"},
    )
    assert resp_admin.status_code == 200
    data_admin = resp_admin.json()["data"]
    assert data_admin["access_token"]
    assert data_admin["user"]["rol"]["codigo"] == "PLATFORM_ADMIN"
    assert data_admin["user"]["tenant"]["codigo"] == "NEXODIGITAL"
    assert data_admin["user"]["tenant"]["plan_tier"] == "PLATFORM_GLOBAL"
    assert "USER_ADMIN" in data_admin["user"]["permisos"]
    assert "TENANT_MANAGE" in data_admin["user"]["permisos"]

    admin_token = data_admin["access_token"]

    # 2. Verify /api/auth/me with Bearer token
    me_resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["correo"] == "admin@veedoria.gob.do"

    # 3. Login as MOPC Auditor (GOV_INSTITUTION scoped to institution_id=5)
    resp_mopc = await client.post(
        "/api/auth/login",
        json={"correo": "auditor@mopc.gob.do", "password": "VeedorIA2026!"},
    )
    assert resp_mopc.status_code == 200
    data_mopc = resp_mopc.json()["data"]
    assert data_mopc["user"]["tenant"]["codigo"] == "MOPC-B2G"
    assert data_mopc["user"]["tenant"]["tipo"] == "GOV_INSTITUTION"
    assert data_mopc["user"]["tenant"]["institution_id"] == 5
    assert data_mopc["user"]["tenant"]["plan_tier"] == "B2G_PREMIUM"
    mopc_token = data_mopc["access_token"]

    # 4. MOPC Auditor cannot access /api/usuarios (requires USER_ADMIN -> 403)
    forbidden_resp = await client.get(
        "/api/usuarios",
        headers={"Authorization": f"Bearer {mopc_token}"},
    )
    assert forbidden_resp.status_code == 403

    # 5. Admin can list users, tenants, and roles matrix
    users_resp = await client.get(
        "/api/usuarios",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert users_resp.status_code == 200
    assert len(users_resp.json()["data"]) >= 5

    tenants_resp = await client.get(
        "/api/tenants",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert tenants_resp.status_code == 200
    assert len(tenants_resp.json()["data"]) >= 5

    roles_resp = await client.get(
        "/api/roles",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert roles_resp.status_code == 200
    roles_payload = roles_resp.json()["data"]
    assert len(roles_payload["roles"]) >= 4
    assert len(roles_payload["permisos"]) >= 13
    assert len(roles_payload["planes_saas"]) == 6


@pytest.mark.asyncio
async def test_lockout_and_admin_unlock_flow(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    resp_admin = await client.post(
        "/api/auth/login",
        json={"correo": "admin@veedoria.gob.do", "password": "VeedorIA2026!"},
    )
    admin_token = resp_admin.json()["data"]["access_token"]

    target_email = "auditor@minerd.gob.do"
    users_list = (
        await client.get("/api/usuarios", headers={"Authorization": f"Bearer {admin_token}"})
    ).json()["data"]
    target_user = next(u for u in users_list if u["correo"] == target_email)

    for _ in range(4):
        r = await client.post(
            "/api/auth/login",
            json={"correo": target_email, "password": "WrongPassword123!"},
        )
        assert r.status_code == 401

    # 5th failed attempt triggers HTTP 429 lockout
    r5 = await client.post(
        "/api/auth/login",
        json={"correo": target_email, "password": "WrongPassword123!"},
    )
    assert r5.status_code == 429

    # Admin unlocks the account
    unlock_resp = await client.post(
        f"/api/usuarios/{target_user['id']}/unlock",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert unlock_resp.status_code == 200
    assert unlock_resp.json()["data"]["intentos_fallidos"] == 0

    # User can now login normally
    ok_resp = await client.post(
        "/api/auth/login",
        json={"correo": target_email, "password": "VeedorIA2026!"},
    )
    assert ok_resp.status_code == 200


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    forgot_resp = await client.post(
        "/api/auth/forgot-password",
        json={"correo": "proveedor@constructora.do"},
    )
    assert forgot_resp.status_code == 200
    preview_url = forgot_resp.json()["data"]["reset_url_preview"]
    assert preview_url and "token=" in preview_url
    reset_token = preview_url.split("token=")[1]

    # Reset password to VeedorIA2026!
    reset_resp = await client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token,
            "nueva_password": "VeedorIA2026!",
            "confirmar_password": "VeedorIA2026!",
        },
    )
    assert reset_resp.status_code == 200

    # Re-using the same token must fail with 400
    reuse_resp = await client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token,
            "nueva_password": "VeedorIA2026!",
            "confirmar_password": "VeedorIA2026!",
        },
    )
    assert reuse_resp.status_code == 400