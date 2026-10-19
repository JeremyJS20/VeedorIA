import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.supplier import Supplier


@pytest.mark.asyncio
async def test_public_portal_and_anomaly_search_flow(client: AsyncClient, db_session: AsyncSession) -> None:
    inst = Institution(dgcp_id="INST-001", name="Ministerio de Educación (MINERD)")
    db_session.add(inst)
    await db_session.flush()

    proc = Process(dgcp_code="MINERD-CCC-LPN-2026-0001", title="Adquisición de Laptops Educativas", institution_id=inst.id)
    db_session.add(proc)
    await db_session.flush()

    sup = Supplier(rnc="130999991", registered_name="Tecnología Dominicana SRL", status="ACTIVO", province="Santo Domingo")
    db_session.add(sup)

    contract = Contract(
        process_id=proc.id,
        contract_id="CONT-2026-001",
        amount_adjudicated=4250000.0,
        supplier_name="Tecnología Dominicana SRL",
        rpe="130999991",
        currency="DOP",
        status="Adjudicado",
        object_description="Suministro de 50 Laptops Educativas",
    )
    db_session.add(contract)
    await db_session.flush()

    item = Item(
        contract_id=contract.id,
        description="Laptop Educativa 14 pulgadas",
        quantity=50.0,
        unit="Unidad",
        unit_price=85000.0,
        total_amount=4250000.0,
        unspsc_code="43211503",
    )
    db_session.add(item)

    anom = Anomaly(
        process_id=proc.id,
        contract_id=contract.id,
        anomaly_type="PRICE_ANOMALY",
        severity=0.85,
        confidence="ALTA",
        description="Precio unitario de DOP $85,000.00 por 'Laptop Educativa 14 pulgadas' supera en un 105% la mediana del mercado (DOP $41,500.00) para la categoría UNSPSC 43211503.",
        supplier_name="Tecnología Dominicana SRL",
        institution_name="Ministerio de Educación (MINERD)",
        process_code="MINERD-CCC-LPN-2026-0001",
    )
    db_session.add(anom)
    await db_session.commit()

    # 1. Test GET /api/anomalies?search=...
    r_anom = await client.get("/api/anomalies?search=Laptops")
    assert r_anom.status_code == 200
    assert r_anom.json()["data"]["total"] == 1

    r_anom_empty = await client.get("/api/anomalies?search=InexistenteXYZ")
    assert r_anom_empty.status_code == 200
    assert r_anom_empty.json()["data"]["total"] == 0

    # 2. Test GET /api/public/tenders
    r_tenders = await client.get("/api/public/tenders?search=Laptops%20MINERD&only_with_anomalies=true")
    assert r_tenders.status_code == 200
    t_data = r_tenders.json()["data"]
    assert t_data["total"] == 1
    assert t_data["items"][0]["anomaly_count"] >= 1

    # 3. Test GET /api/public/budget-overview
    r_budget = await client.get("/api/public/budget-overview")
    assert r_budget.status_code == 200
    b_data = r_budget.json()["data"]
    assert len(b_data["sankey"]["institutions"]) == 1
    assert len(b_data["provinces"]) == 10

    # 4. Test GET /api/public/price-comparison
    r_price = await client.get("/api/public/price-comparison")
    assert r_price.status_code == 200
    p_data = r_price.json()["data"]
    assert len(p_data) == 1
    assert p_data[0]["overprice_pct"] == 105.0

    # 5. Test GET /api/public/tenders/{id}
    r_detail = await client.get(f"/api/public/tenders/{contract.id}")
    assert r_detail.status_code == 200
    assert len(r_detail.json()["data"]["items"]) == 1
    assert len(r_detail.json()["data"]["anomalies"]) == 1

    # 6. Test GET /api/public/suppliers/{rnc}
    r_sup = await client.get("/api/public/suppliers/130999991")
    assert r_sup.status_code == 200
    assert r_sup.json()["data"]["contracts_count"] == 1

    # 7. Test GET /api/public/institutions/{id} and /api/public/ranking
    r_inst = await client.get(f"/api/public/institutions/{inst.id}")
    assert r_inst.status_code == 200
    assert r_inst.json()["data"]["contracts_count"] == 1

    r_rank = await client.get("/api/public/ranking")
    assert r_rank.status_code == 200
    assert r_rank.json()["data"]["total_institutions"] == 1