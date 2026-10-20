import secrets
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.auth_service import ensure_auth_seed


@pytest.mark.asyncio
async def test_invitation_gateway_and_registration_paths(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    # 1. Valid invitation code (REQ-001)
    resp_valid = await client.get("/api/auth/invitation/MOPC-B2G")
    assert resp_valid.status_code == 200
    inv_data = resp_valid.json()["data"]
    assert inv_data["codigo"] == "MOPC-B2G"
    assert inv_data["plan_etiqueta"] == "Plan Institucional Avanzado"
    assert inv_data["estado"] == "ACTIVO"

    # 2. Invalid invitation code returns 404 (REQ-001)
    resp_invalid = await client.get("/api/auth/invitation/CODIGO-NO-EXISTE")
    assert resp_invalid.status_code == 404

    # 3. Public suppliers search (REQ-002)
    resp_sups = await client.get("/api/auth/suppliers-search?q=CONSTRUCTORA")
    assert resp_sups.status_code == 200
    assert isinstance(resp_sups.json()["data"], list)

    # 4. Path A Registration: Join existing organization with invitation code (REQ-002)
    unique_suffix = secrets.token_hex(3)
    resp_reg_a = await client.post(
        "/api/auth/register",
        json={
            "modo": "INVITATION",
            "codigo_invitacion": "MOPC-B2G",
            "nombre": "Carlos Invitado MOPC",
            "correo": f"invitado.{unique_suffix}@mopc.gob.do",
            "cargo": "Auditor Preventivo",
            "password": "VeedorIA2026!",
        },
    )
    assert resp_reg_a.status_code == 201
    reg_a_data = resp_reg_a.json()["data"]
    assert reg_a_data["access_token"]
    assert reg_a_data["user"]["tenant"]["codigo"] == "MOPC-B2G"
    assert reg_a_data["user"]["rol"]["codigo"] == "AUDITOR"

    # 5. Path B Registration: Self-service new supplier company (REQ-002)
    resp_reg_b = await client.post(
        "/api/auth/register",
        json={
            "modo": "NEW_COMPANY",
            "nombre": "Laura Méndez",
            "correo": f"lmendez.{unique_suffix}@suministros.do",
            "cargo": "Gerente de Licitaciones",
            "password": "VeedorIA2026!",
            "empresa_nombre": f"Suministros del Este {unique_suffix.upper()} SRL",
            "empresa_rpe": f"RPE{unique_suffix.upper()}",
            "empresa_rnc": f"131-{unique_suffix[:5]}",
            "plan_tier": "B2B_PYME",
        },
    )
    assert resp_reg_b.status_code == 201
    reg_b_data = resp_reg_b.json()["data"]
    assert reg_b_data["access_token"]
    assert reg_b_data["user"]["tenant"]["tipo"] == "B2B_SUPPLIER"
    assert reg_b_data["user"]["tenant"]["plan_tier"] == "B2B_PYME"
    assert "B2B_ANALYTICS" in reg_b_data["user"]["permisos"]


@pytest.mark.asyncio
async def test_multi_role_dashboard_and_market_intelligence(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    # 1. Admin Dashboard Overview (REQ-005)
    login_admin = await client.post(
        "/api/auth/login",
        json={"correo": "admin@veedoria.gob.do", "password": "VeedorIA2026!"},
    )
    admin_token = login_admin.json()["data"]["access_token"]

    ov_admin = await client.get(
        "/api/dashboard/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ov_admin.status_code == 200
    assert ov_admin.json()["data"]["variant"] == "ADMIN"
    assert len(ov_admin.json()["data"]["kpis"]) == 4

    # 2. B2G Basic Auditor (MINERD) sees locked 4th KPI (REQ-003)
    login_minerd = await client.post(
        "/api/auth/login",
        json={"correo": "auditor@minerd.gob.do", "password": "VeedorIA2026!"},
    )
    minerd_token = login_minerd.json()["data"]["access_token"]

    ov_minerd = await client.get(
        "/api/dashboard/overview",
        headers={"Authorization": f"Bearer {minerd_token}"},
    )
    assert ov_minerd.status_code == 200
    minerd_data = ov_minerd.json()["data"]
    assert minerd_data["variant"] == "B2G"
    assert minerd_data["kpis"][3]["locked"] is True

    # 3. B2B Corporate Supplier Dashboard & Market Intelligence (REQ-004, REQ-006)
    login_b2b = await client.post(
        "/api/auth/login",
        json={"correo": "proveedor@constructora.do", "password": "VeedorIA2026!"},
    )
    b2b_token = login_b2b.json()["data"]["access_token"]

    ov_b2b = await client.get(
        "/api/dashboard/overview",
        headers={"Authorization": f"Bearer {b2b_token}"},
    )
    assert ov_b2b.status_code == 200
    assert ov_b2b.json()["data"]["variant"] == "B2B"
    assert ov_b2b.json()["data"]["kpis"][1]["locked"] is False

    mkt_resp = await client.get(
        "/api/market/intelligence",
        headers={"Authorization": f"Bearer {b2b_token}"},
    )
    assert mkt_resp.status_code == 200
    mkt_data = mkt_resp.json()["data"]
    assert len(mkt_data["available_families"]) >= 1
    assert mkt_data["supplier_share"]["locked"] is False
    assert mkt_data["winning_price_range"]["locked"] is False