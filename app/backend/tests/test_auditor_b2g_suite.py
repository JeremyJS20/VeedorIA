import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.process import Process
from src.services.auth_service import ensure_auth_seed


@pytest.mark.asyncio
async def test_auditor_b2g_full_suite(client: AsyncClient, db_session: AsyncSession):
    await ensure_auth_seed(db_session)

    # Seed sample institution, process, contracts, and anomalies
    inst = Institution(id=5, dgcp_id="DGCP-MOPC-5", name="Ministerio de Obras Públicas y Comunicaciones")
    db_session.add(inst)
    await db_session.flush()

    proc = Process(
        id=501,
        dgcp_code="MOPC-CCC-CP-2026-0009",
        title="Adquisición de Materiales Viales Regionales",
        status="Adjudicado",
        institution_id=5,
    )
    db_session.add(proc)
    await db_session.flush()

    c1 = Contract(
        id=9001,
        contract_id="MOPC-2026-00901",
        process_id=501,
        supplier_name="Constructora del Cibao SRL",
        rpe="RPE-9001",
        amount_adjudicated=4200000.0,
        object_description="Suministro de hormigón asfáltico lote A",
    )
    c2 = Contract(
        id=9002,
        contract_id="MOPC-2026-00902",
        process_id=501,
        supplier_name="Inversiones Viales del Norte SRL",
        rpe="RPE-9002",
        amount_adjudicated=3900000.0,
        object_description="Suministro de hormigón asfáltico lote B",
    )
    db_session.add_all([c1, c2])
    await db_session.flush()

    anom_frag = Anomaly(
        id="anom-frag-501",
        process_id=501,
        contract_id=9001,
        anomaly_type="FRAGMENTATION",
        severity=0.82,
        score=0.82,
        status="CONFIRMED",
        reviewer_id=None,
        process_code="MOPC-CCC-CP-2026-0009",
        institution_name="Ministerio de Obras Públicas y Comunicaciones",
        supplier_name="Constructora del Cibao SRL",
        amount=4200000.0,
        description="Posible fraccionamiento: contratos MOPC-2026-00901 y MOPC-2026-00902 suman DOP $8,100,000.00 superando el umbral de Comparación de Precios (CP) (DOP $6,500,000.00).",
    )
    db_session.add(anom_frag)
    await db_session.commit()

    # Login tokens
    login_admin = await client.post(
        "/api/auth/login",
        json={"correo": "admin@veedoria.gob.do", "password": "VeedorIA2026!"},
    )
    admin_token = login_admin.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    login_minerd = await client.post(
        "/api/auth/login",
        json={"correo": "auditor@minerd.gob.do", "password": "VeedorIA2026!"},
    )
    minerd_token = login_minerd.json()["data"]["access_token"]
    minerd_headers = {"Authorization": f"Bearer {minerd_token}"}

    login_b2b = await client.post(
        "/api/auth/login",
        json={"correo": "proveedor@constructora.do", "password": "VeedorIA2026!"},
    )
    b2b_token = login_b2b.json()["data"]["access_token"]
    b2b_headers = {"Authorization": f"Bearer {b2b_token}"}

    # 1. B2B Supplier is blocked from B2G Auditor endpoints (403)
    resp_b2b_proc = await client.get("/api/auditor/processes", headers=b2b_headers)
    assert resp_b2b_proc.status_code == 403

    # 2. REQ-001: Institutional Processes Explorer & Internal Process Detail Drawer
    resp_procs = await client.get("/api/auditor/processes?only_with_anomalies=true", headers=admin_headers)
    assert resp_procs.status_code == 200
    procs_data = resp_procs.json()["data"]
    assert procs_data["total"] >= 1
    assert any(p["process_code"] == "MOPC-CCC-CP-2026-0009" for p in procs_data["items"])

    resp_proc_detail = await client.get("/api/auditor/processes/501", headers=admin_headers)
    assert resp_proc_detail.status_code == 200
    detail_data = resp_proc_detail.json()["data"]
    assert detail_data["process_code"] == "MOPC-CCC-CP-2026-0009"
    assert len(detail_data["contracts"]) == 2
    assert len(detail_data["anomalies"]) == 1

    # 3. REQ-002: Collusion Network (locked for B2G_BASIC MINERD, unlocked for Admin)
    resp_coll_basic = await client.get("/api/auditor/collusion-network", headers=minerd_headers)
    assert resp_coll_basic.status_code == 200
    assert resp_coll_basic.json()["data"]["locked"] is True

    resp_coll_admin = await client.get("/api/auditor/collusion-network", headers=admin_headers)
    assert resp_coll_admin.status_code == 200
    assert resp_coll_admin.json()["data"]["locked"] is False

    # 4. REQ-003: Detection Config & DB-backed DGCP Modality Thresholds
    resp_cfg = await client.get("/api/auditor/detection-config", headers=admin_headers)
    assert resp_cfg.status_code == 200
    cfg_data = resp_cfg.json()["data"]
    assert cfg_data["can_edit"] is True
    param_keys = {p["key"] for p in cfg_data["parameters"]}
    assert "THRESHOLD_CP_DOP" in param_keys
    assert "THRESHOLD_PEEN_DOP" in param_keys

    resp_cfg_update = await client.put(
        "/api/auditor/detection-config",
        headers=admin_headers,
        json={"parameters": {"THRESHOLD_CP_DOP": 7000000.0, "PRICE_ANOMALY_WEIGHT": 1.3}},
    )
    assert resp_cfg_update.status_code == 200
    updated_map = {p["key"]: p["value"] for p in resp_cfg_update.json()["data"]["parameters"]}
    assert updated_map["THRESHOLD_CP_DOP"] == 7000000.0
    assert updated_map["PRICE_ANOMALY_WEIGHT"] == 1.3

    # Verify Anomaly Context dynamically reflects the updated DB threshold for -CP-
    resp_anom_ctx = await client.get("/api/anomalies/anom-frag-501/context")
    assert resp_anom_ctx.status_code == 200
    ctx_payload = resp_anom_ctx.json()["data"]
    assert ctx_payload["fragmentation_threshold"] == 7000000.0
    assert sum(1 for c in ctx_payload["recent_contracts"] if c["is_alert"]) == 2

    # 5. REQ-004 & REQ-005: Resolutions History & Compliance Reports Summary
    resp_res = await client.get("/api/auditor/resolutions", headers=admin_headers)
    assert resp_res.status_code == 200
    assert resp_res.json()["data"]["kpis"]["total_resolved"] >= 1

    resp_rep = await client.get("/api/auditor/reports/summary?period=ALL", headers=admin_headers)
    assert resp_rep.status_code == 200
    rep_data = resp_rep.json()["data"]
    assert rep_data["kpis"]["total_anomalies"] >= 1

    # 6. REQ-006: Integrations Lifecycle & External /api/integration/* Endpoints
    resp_int_create = await client.post(
        "/api/auditor/integrations/keys",
        headers=admin_headers,
        json={"name": "Conector SIGEF Pruebas", "system_target": "SIGEF / Hacienda"},
    )
    assert resp_int_create.status_code == 200
    created_key = resp_int_create.json()["data"]
    raw_secret = created_key["raw_token"]
    key_id = created_key["id"]
    assert raw_secret.startswith("vdia_b2g_")

    # Consume external /api/integration/* using the issued API key
    ext_headers = {"X-Integration-Key": raw_secret}
    ext_anom = await client.get("/api/integration/anomalies", headers=ext_headers)
    assert ext_anom.status_code == 200
    assert ext_anom.json()["data"]["total"] >= 1

    ext_rep = await client.get("/api/integration/reports/summary", headers=ext_headers)
    assert ext_rep.status_code == 200

    ext_res = await client.get("/api/integration/resolutions", headers=ext_headers)
    assert ext_res.status_code == 200

    # Revoke key and verify external access is rejected (401)
    resp_revoke = await client.delete(f"/api/auditor/integrations/keys/{key_id}", headers=admin_headers)
    assert resp_revoke.status_code == 200

    ext_after_revoke = await client.get("/api/integration/anomalies", headers=ext_headers)
    assert ext_after_revoke.status_code == 401