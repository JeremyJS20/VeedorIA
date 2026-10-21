import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.audit_log import AuditLog
from src.models.auth import AppUser
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.user import User
from src.services.auth_service import ensure_auth_seed


@pytest.mark.asyncio
async def test_b2b_suite_full_suite(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    # audit_log.user_id → tabla legacy "user" (FK histórica). Prencherla con
    # los ids de AppUser multi-tenant para trazabilidad de auditoría B2B.
    users_stmt = await db_session.execute(select(AppUser))
    for app_user in users_stmt.scalars().all():
        db_session.add(
            User(
                id=str(app_user.id),
                email=app_user.correo,
                password_hash=app_user.password_hash,
                full_name=app_user.nombre,
                role="BIDDER",
            )
        )
    await db_session.commit()

    # Seed: 1 institution, 2 processes, contracts for tenant RPE 132993 and
    # a competitor (RPE-9020) with UNSPSC items to feed the price simulator.
    inst = Institution(id=7, dgcp_id="DGCP-DGCP-7", name="Dirección General de Compras y Contrataciones Públicas")
    db_session.add(inst)
    await db_session.flush()

    proc_marc = Process(
        id=601,
        dgcp_code="DGCP-CCC-LPN-2026-0101",
        title="Supervisión de Obras de Remodelación Nacional",
        status="Adjudicado",
        institution_id=7,
    )
    proc_lpn = Process(
        id=602,
        dgcp_code="DGCP-LIC-LPN-2026-0102",
        title="Adquisición de Suministros Diversos LPN",
        status="En Vigilancia",
        institution_id=7,
    )
    db_session.add_all([proc_marc, proc_lpn])
    await db_session.flush()

    own_c = Contract(
        id=9101,
        contract_id="DGCP-2026-09101",
        process_id=601,
        supplier_name="Constructora & Suministros del Caribe, S.R.L.",
        rpe="132993",
        amount_adjudicated=18000000.0,
        object_description="Supervisión de obras",
    )
    comp_c1 = Contract(
        id=9102,
        contract_id="DGCP-2026-09102",
        process_id=602,
        supplier_name="Forense Import & Supply SRL",
        rpe="RPE-9020",
        amount_adjudicated=5200000.0,
        object_description="Suministro de equipos",
    )
    comp_c2 = Contract(
        id=9103,
        contract_id="DGCP-2026-09103",
        process_id=602,
        supplier_name="Forense Import & Supply SRL",
        rpe="RPE-9020",
        amount_adjudicated=3100000.0,
        object_description="Suministro de repuestos",
    )
    db_session.add_all([own_c, comp_c1, comp_c2])
    await db_session.flush()

    item_prices = [1000.0, 2000.0, 3000.0, 4000.0]
    for idx, price in enumerate(item_prices):
        db_session.add(
            Item(
                id=7000 + idx,
                contract_id=9102,
                unspsc_family="7214",
                unspsc_code="72141500",
                description=f"Item de prueba {idx + 1}",
                unit="Unidad",
                unit_price=price,
            )
        )
    await db_session.commit()

    # Login tokens
    login_prov = await client.post(
        "/api/auth/login",
        json={"correo": "proveedor@constructora.do", "password": "VeedorIA2026!"},
    )
    assert login_prov.status_code == 200
    prov_token = login_prov.json()["data"]["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    login_admin = await client.post(
        "/api/auth/login",
        json={"correo": "admin@veedoria.gob.do", "password": "VeedorIA2026!"},
    )
    admin_token = login_admin.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    login_dgcp = await client.post(
        "/api/auth/login",
        json={"correo": "auditor@dgcp.gob.do", "password": "VeedorIA2026!"},
    )
    dgcp_token = login_dgcp.json()["data"]["access_token"]
    dgcp_headers = {"Authorization": f"Bearer {dgcp_token}"}

    # 0. Unauthenticated request is rejected
    resp_unauth = await client.get("/api/b2b/opportunities")
    assert resp_unauth.status_code == 401

    # 1. REQ-001: Radar de Oportunidades (#23)
    resp_opp = await client.get("/api/b2b/opportunities", headers=prov_headers)
    assert resp_opp.status_code == 200
    opp_data = resp_opp.json()["data"]
    assert opp_data["total"] >= 1
    assert opp_data["kpis"]["total_opportunities"] == opp_data["total"]
    assert opp_data["kpis"]["monitored_families_count"] >= 1
    target = next(o for o in opp_data["items"] if o["process_id"] == 601)
    assert target["process_code"] == "DGCP-CCC-LPN-2026-0101"
    assert target["modality"] == "Licitación Pública Nacional"
    assert target["institution_name"].startswith("Dirección General")
    assert 0 <= target["affinity_score"] <= 99
    assert target["competition_level"] in ("ALTA", "MEDIA", "BAJA")

    # High-affinity filter returns a subset (affinity >= 80)
    resp_opp_hi = await client.get(
        "/api/b2b/opportunities?only_high_affinity=true", headers=prov_headers
    )
    assert resp_opp_hi.status_code == 200
    assert all(o["affinity_score"] >= 80 for o in resp_opp_hi.json()["data"]["items"])

    # Pagination contract
    assert resp_opp.json()["data"]["page"] == 1
    assert resp_opp.json()["data"]["limit"] == 20

    # 2. REQ-002: Seguimiento de Mis Licitaciones (#24) — watchlist CRUD
    resp_bid_create = await client.post(
        "/api/b2b/bids",
        headers=prov_headers,
        json={"process_id": 601, "notes": "Interés estratégico"},
    )
    assert resp_bid_create.status_code == 200
    bid_created = resp_bid_create.json()["data"]
    assert bid_created["bid_id"] == "bid-601"
    assert bid_created["process_code"] == "DGCP-CCC-LPN-2026-0101"
    assert bid_created["stage"] == "GUARDADA"

    # Regresión PostgreSQL: audit_log.timestamp debe persistirse naive (asyncpg rechaza aware)
    db_session.expire_all()
    latest_log = (
        await db_session.execute(
            select(AuditLog)
            .where(AuditLog.entity_type == "B2B_WATCHLIST:5")
            .order_by(AuditLog.id.desc())
        )
    ).scalars().first()
    assert latest_log is not None
    assert latest_log.timestamp.tzinfo is None

    resp_bids = await client.get("/api/b2b/bids", headers=prov_headers)
    assert resp_bids.status_code == 200
    bids_data = resp_bids.json()["data"]
    assert bids_data["active_limit"] == 9999  # B2B_CORPORATE
    assert any(b["bid_id"] == "bid-601" for b in bids_data["items"])

    # Second bid keeps the watchlist non-empty (avoids the demo-sample fallback
    # that fires only when the watchlist is completely empty)
    resp_bid_create2 = await client.post(
        "/api/b2b/bids",
        headers=prov_headers,
        json={"process_id": 602, "title": "Adquisición de Suministros Diversos LPN"},
    )
    assert resp_bid_create2.status_code == 200

    # Watchlist flag reflected in opportunities
    resp_opp_watched = await client.get(
        "/api/b2b/opportunities", headers=prov_headers
    )
    watched_target = next(
        o for o in resp_opp_watched.json()["data"]["items"] if o["process_id"] == 601
    )
    assert watched_target["in_watchlist"] is True

    resp_bid_update = await client.put(
        "/api/b2b/bids/bid-601",
        headers=prov_headers,
        json={"process_id": 601, "stage": "OFERTA_ENVIADA", "priority": "ALTA"},
    )
    assert resp_bid_update.status_code == 200
    assert resp_bid_update.json()["data"]["stage"] == "OFERTA_ENVIADA"

    resp_bids_after_update = await client.get("/api/b2b/bids", headers=prov_headers)
    kpis_update = resp_bids_after_update.json()["data"]["kpis"]
    assert kpis_update["submitted_count"] == 1

    resp_bid_delete = await client.delete("/api/b2b/bids/bid-601", headers=prov_headers)
    assert resp_bid_delete.status_code == 200
    assert resp_bid_delete.json()["data"]["deleted"] is True

    resp_bids_after_delete = await client.get("/api/b2b/bids", headers=prov_headers)
    assert all(b["bid_id"] != "bid-601" for b in resp_bids_after_delete.json()["data"]["items"])

    # 3. REQ-003: Ficha Forense de Competidor (#25) — unlocked for B2B_CORPORATE
    resp_competitors = await client.get("/api/b2b/competitors", headers=prov_headers)
    assert resp_competitors.status_code == 200
    competitors = resp_competitors.json()["data"]
    assert any(c["rpe"] == "RPE-9020" for c in competitors)

    resp_comp_q = await client.get(
        "/api/b2b/competitors?q=9020", headers=prov_headers
    )
    assert resp_comp_q.status_code == 200
    assert all("9020" in c["rpe"] for c in resp_comp_q.json()["data"])

    resp_profile = await client.get(
        "/api/b2b/competitors/RPE-9020", headers=prov_headers
    )
    assert resp_profile.status_code == 200
    profile = resp_profile.json()["data"]
    assert profile["supplier"]["rpe"] == "RPE-9020"
    assert profile["supplier"]["name"] == "Forense Import & Supply SRL"
    assert profile["kpis"]["contracts_won"] == 2
    assert profile["kpis"]["total_adjudicated_dop"] == 8300000.0
    assert len(profile["top_institutions"]) == 1
    assert profile["forensic_intelligence"]["locked"] is False
    assert len(profile["forensic_intelligence"]["shared_unspsc_pricing"]) >= 1
    pricing_row = profile["forensic_intelligence"]["shared_unspsc_pricing"][0]
    assert pricing_row["unspsc_family"] == "7214"
    assert pricing_row["contracts_in_family"] == 4

    # 4. REQ-004: Simulador de Precios (#26)
    resp_catalog = await client.get("/api/b2b/price-simulator/catalog", headers=prov_headers)
    assert resp_catalog.status_code == 200
    catalog_data = resp_catalog.json()["data"]
    assert any(c["unspsc_family"] == "7214" for c in catalog_data)

    # Banda óptima: 1900 entre 0.7*P25(1000)=700 y mediana(2000)
    resp_sim_opt = await client.post(
        "/api/b2b/price-simulator",
        headers=prov_headers,
        json={"unspsc_family": "7214", "proposed_unit_price_dop": 1900.0, "quantity": 100},
    )
    assert resp_sim_opt.status_code == 200
    sim_opt = resp_sim_opt.json()["data"]
    assert sim_opt["risk_band"] == "OPTIMA_COMPETITIVA"
    assert sim_opt["distribution"]["min_dop"] == 1000.0
    assert sim_opt["distribution"]["p25_dop"] == 1000.0
    assert sim_opt["distribution"]["median_p50_dop"] == 2000.0
    assert sim_opt["distribution"]["p75_dop"] == 3000.0
    assert sim_opt["distribution"]["max_dop"] == 4000.0
    assert sim_opt["sample_size"] == 4
    assert sim_opt["projected_total_dop"] == 190000.0
    assert 0 <= sim_opt["competitiveness_index"] <= 100
    assert 0 <= sim_opt["win_probability_pct"] <= 100
    assert sim_opt["legal_advisory"]  # asesoría legal no vacía

    # Baja temeraria: 500 por debajo de 0.7*P25 = 700
    resp_sim_temeraria = await client.post(
        "/api/b2b/price-simulator",
        headers=prov_headers,
        json={"proposed_unit_price_dop": 500.0},
    )
    sim_temeraria = resp_sim_temeraria.json()["data"]
    assert sim_temeraria["risk_band"] == "BAJA_TEMERARIA"

    # Sobreprecio: 5000 por encima de P75 (4000)
    resp_sim_sobreprecio = await client.post(
        "/api/b2b/price-simulator",
        headers=prov_headers,
        json={"proposed_unit_price_dop": 5000.0},
    )
    sim_sobreprecio = resp_sim_sobreprecio.json()["data"]
    assert sim_sobreprecio["risk_band"] == "RIESGO_SOBREPRECIO"

    # Validación: precio y cantidad deben ser > 0
    resp_sim_invalid = await client.post(
        "/api/b2b/price-simulator",
        headers=prov_headers,
        json={"proposed_unit_price_dop": -5.0},
    )
    assert resp_sim_invalid.status_code == 422

    # 5. REQ-005: Explorador de Sectores (#27)
    resp_sectors = await client.get("/api/b2b/sectors", headers=prov_headers)
    assert resp_sectors.status_code == 200
    sectors_data = resp_sectors.json()["data"]
    assert sectors_data["plan_tier"] == "B2B_CORPORATE"
    assert sectors_data["max_families_allowed"] == 9999
    fam_7214 = next(s for s in sectors_data["sectors"] if s["unspsc_family"] == "7214")
    assert fam_7214["total_contracts"] >= 1
    assert fam_7214["competition_density"] in ("ALTA", "MEDIA", "BAJA")

    # CORPORATE: monitoring more than 3 families is allowed
    resp_sectors_update = await client.put(
        "/api/b2b/sectors",
        headers=prov_headers,
        json={"monitored_families": ["7214", "3011", "4321", "5019"]},
    )
    assert resp_sectors_update.status_code == 200
    updated_sector_7214 = next(
        s for s in resp_sectors_update.json()["data"]["sectors"] if s["unspsc_family"] == "7214"
    )
    assert updated_sector_7214["is_monitored"] is True

    # 6. REQ-006: Suscripción (#29) — summary, permissions and plan change
    resp_sub = await client.get("/api/b2b/subscription", headers=prov_headers)
    assert resp_sub.status_code == 200
    sub_data = resp_sub.json()["data"]
    assert sub_data["tenant"]["codigo"] == "CONSTRUCTORA-B2B"
    assert sub_data["tenant"]["plan_tier"] == "B2B_CORPORATE"
    assert sub_data["tenant"]["supplier_rpe"] == "132993"
    assert len(sub_data["available_plans"]) == 2

    # Invalid plan rejected
    resp_sub_invalid = await client.put(
        "/api/b2b/subscription",
        headers=prov_headers,
        json={"target_plan_tier": "B2B_GOLD"},
    )
    assert resp_sub_invalid.status_code == 422

    # Only org administrators can change the plan (dgcp auditor role = AUDITOR)
    resp_sub_forbidden = await client.put(
        "/api/b2b/subscription",
        headers=dgcp_headers,
        json={"target_plan_tier": "B2B_PYME"},
    )
    assert resp_sub_forbidden.status_code == 403

    # Successful downgrade PROVEEDOR → B2B_PYME
    resp_sub_down = await client.put(
        "/api/b2b/subscription",
        headers=prov_headers,
        json={"target_plan_tier": "B2B_PYME", "billing_cycle": "ANUAL"},
    )
    assert resp_sub_down.status_code == 200
    sub_down = resp_sub_down.json()["data"]
    assert sub_down["tenant"]["plan_tier"] == "B2B_PYME"
    assert sub_down["tenant"]["plan_label"] == "Plan Proveedor PyME"
    assert sub_down["usage"]["monitored_families_limit"] == 3
    assert sub_down["usage"]["active_bids_limit"] == 10
    assert sub_down["usage"]["team_members_limit"] == 5
    # History records the plan change
    assert any("B2B_PYME" in h["action"] for h in sub_down["history"])

    # 7. PYME plan gates after downgrade
    # a) Forensic competitor intelligence locked
    resp_profile_pyme = await client.get(
        "/api/b2b/competitors/RPE-9020", headers=prov_headers
    )
    assert resp_profile_pyme.status_code == 200
    profile_pyme = resp_profile_pyme.json()["data"]
    assert profile_pyme["forensic_intelligence"]["locked"] is True
    assert profile_pyme["forensic_intelligence"]["required_plan_label"] == "Plan Proveedor Corporativo"
    assert profile_pyme["forensic_intelligence"]["shared_unspsc_pricing"] == []

    # b) Sector monitoring quota (max 3 families)
    resp_sectors_quota = await client.put(
        "/api/b2b/sectors",
        headers=prov_headers,
        json={"monitored_families": ["7214", "3011", "4321", "5019"]},
    )
    assert resp_sectors_quota.status_code == 403
    assert resp_sectors_quota.json()["detail"]["code"] == "PLAN_QUOTA_EXCEEDED"

    # c) Active bids quota (max 10 simultaneous)
    # Watchlist currently has the sectors entry only — fill manager quotas.
    for i in range(9):
        payload = {"process_id": 8000 + i, "title": f"Proceso de prueba {i}"}
        resp_fill = await client.post("/api/b2b/bids", headers=prov_headers, json=payload)
        assert resp_fill.status_code == 200
    # Watchlist ahora tiene 10 activos → el 11o excede la cuota PYME
    resp_quota_bid = await client.post(
        "/api/b2b/bids",
        headers=prov_headers,
        json={"process_id": 9999, "title": "Proceso final"},
    )
    assert resp_quota_bid.status_code == 403
    assert resp_quota_bid.json()["detail"]["code"] == "PLAN_QUOTA_EXCEEDED"

    # d) B2B suite visible for an alternative admin (PLATFORM) but APIs work
    resp_admin_opp = await client.get("/api/b2b/opportunities", headers=admin_headers)
    assert resp_admin_opp.status_code == 200
