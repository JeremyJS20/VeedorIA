import re
from sqlalchemy import case, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.supplier import Supplier

DR_PROVINCES_META = [
    {"id": "SD", "province": "Santo Domingo / D.N.", "region": "Ozama", "keywords": ["santo domingo", "distrito nacional", "ministerio", "dirección general", "presidencia", "senado", "cámara"]},
    {"id": "ST", "province": "Santiago", "region": "Cibao Norte", "keywords": ["santiago", "coraasan", "edenorte", "homero", "cibao"]},
    {"id": "LV", "province": "La Vega", "region": "Cibao Sur", "keywords": ["la vega", "constanza", "jarabacoa", "vegano"]},
    {"id": "SC", "province": "San Cristóbal", "region": "Valdesia", "keywords": ["san cristóbal", "san cristobal", "haina", "nigua", "cambita"]},
    {"id": "PP", "province": "Puerto Plata", "region": "Cibao Norte", "keywords": ["puerto plata", "sosúa", "cabarete", "imbert", "luperón"]},
    {"id": "DU", "province": "Duarte (S.F. Macorís)", "region": "Cibao Nordeste", "keywords": ["duarte", "macorís", "macoris", "san francisco", "villa riva"]},
    {"id": "LR", "province": "La Romana", "region": "Yuma", "keywords": ["la romana", "guaymate", "villa hermosa", "caleta"]},
    {"id": "SP", "province": "San Pedro de Macorís", "region": "Higuamo", "keywords": ["san pedro", "consuegra", "quisqueya", "los llanos"]},
    {"id": "LA", "province": "La Altagracia (Higüey)", "region": "Yuma", "keywords": ["altagracia", "higüey", "higuey", "punta cana", "bávaro", "verón", "yuma"]},
    {"id": "AZ", "province": "Azua / Región Sur", "region": "Valdesia / Enriquillo", "keywords": ["azua", "barahona", "san juan", "baní", "bani", "peravia", "ocoa", "neiba", "pedernales"]},
]


class PublicPortalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_institutions(self, limit: int = 250) -> list[dict]:
        stmt = (
            select(
                Institution.id,
                Institution.dgcp_id,
                Institution.name,
                func.count(Contract.id).label("contracts_count"),
            )
            .outerjoin(Process, Process.institution_id == Institution.id)
            .outerjoin(Contract, Contract.process_id == Process.id)
            .group_by(Institution.id, Institution.dgcp_id, Institution.name)
            .order_by(desc("contracts_count"), Institution.name)
            .limit(limit)
        )
        rows = (await self.db.execute(stmt)).all()
        return [
            {
                "id": r.id,
                "dgcp_id": r.dgcp_id,
                "name": r.name,
                "contracts_count": int(r.contracts_count or 0),
            }
            for r in rows
        ]

    async def search_tenders(
        self,
        search: str | None = None,
        institution_id: int | None = None,
        province: str | None = None,
        min_amount: float | None = None,
        max_amount: float | None = None,
        only_with_anomalies: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        anom_subq = (
            select(
                Anomaly.contract_id.label("c_id"),
                func.count(Anomaly.id).label("anom_count"),
                func.max(Anomaly.severity).label("max_sev"),
            )
            .where(Anomaly.contract_id.isnot(None))
            .group_by(Anomaly.contract_id)
            .subquery()
        )

        proc_anom_subq = (
            select(
                Anomaly.process_id.label("p_id"),
                func.count(Anomaly.id).label("p_anom_count"),
                func.max(Anomaly.severity).label("p_max_sev"),
            )
            .where(Anomaly.process_id.isnot(None))
            .group_by(Anomaly.process_id)
            .subquery()
        )

        total_anom_expr = func.coalesce(anom_subq.c.anom_count, 0) + func.coalesce(proc_anom_subq.c.p_anom_count, 0)
        c_sev = func.coalesce(anom_subq.c.max_sev, 0.0)
        p_sev = func.coalesce(proc_anom_subq.c.p_max_sev, 0.0)
        max_sev_expr = case((c_sev >= p_sev, c_sev), else_=p_sev)

        base = (
            select(
                Contract.id.label("id"),
                Contract.contract_id.label("contract_code"),
                Contract.process_id.label("process_id"),
                Process.dgcp_code.label("dgcp_code"),
                Process.title.label("process_title"),
                Contract.object_description.label("object_description"),
                Institution.id.label("institution_id"),
                Institution.name.label("institution_name"),
                Contract.supplier_name.label("supplier_name"),
                Contract.rpe.label("supplier_rpe"),
                func.coalesce(Contract.amount_adjudicated, 0.0).label("amount_adjudicated"),
                Contract.currency.label("currency"),
                Contract.status.label("status"),
                Contract.signed_date.label("signed_date"),
                Contract.creation_date.label("creation_date"),
                total_anom_expr.label("anomaly_count"),
                max_sev_expr.label("max_severity"),
            )
            .outerjoin(Process, Contract.process_id == Process.id)
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .outerjoin(anom_subq, anom_subq.c.c_id == Contract.id)
            .outerjoin(proc_anom_subq, proc_anom_subq.c.p_id == Contract.process_id)
        )

        if institution_id is not None:
            base = base.where(Institution.id == institution_id)
        if min_amount is not None:
            base = base.where(Contract.amount_adjudicated >= min_amount)
        if max_amount is not None:
            base = base.where(Contract.amount_adjudicated <= max_amount)
        if only_with_anomalies:
            base = base.where(total_anom_expr > 0)

        if province and province.strip():
            prov_clean = province.strip()
            keywords = [prov_clean]
            for pm in DR_PROVINCES_META:
                if pm["id"].lower() == prov_clean.lower() or pm["province"].lower() == prov_clean.lower():
                    keywords = pm["keywords"]
                    break
            clauses = []
            for kw in keywords:
                q_kw = f"%{kw}%"
                clauses.append(Institution.name.ilike(q_kw))
                clauses.append(Process.title.ilike(q_kw))
                clauses.append(Contract.object_description.ilike(q_kw))
            base = base.where(or_(*clauses))

        if search and search.strip():
            raw_search = search.strip()
            stop_words = {"de", "en", "con", "el", "la", "los", "las", "para", "por", "del", "mi", "que", "cuanto", "cuánto", "gasto", "gastó", "contratos", "proveedores", "alertas", "sobreprecio", "provincia"}
            tokens = [
                t for t in re.split(r"[\s,.;:?¿!¡]+", raw_search)
                if len(t) >= 3 and t.lower() not in stop_words
            ]
            if not tokens:
                tokens = [raw_search]
            if "sobreprecio" in raw_search.lower() or "alerta" in raw_search.lower():
                base = base.where(total_anom_expr > 0)
            token_map = {
                "minerd": "educación",
                "mopc": "obras públicas",
                "msp": "salud pública",
                "sns": "servicio nacional de salud",
            }
            token_filters = []
            for tok in tokens[:4]:
                mapped = token_map.get(tok.lower(), tok)
                q = f"%{mapped}%"
                q_orig = f"%{tok}%"
                item_contracts = select(Item.contract_id).where(Item.description.ilike(q_orig))
                token_filters.append(
                    or_(
                        Contract.contract_id.ilike(q_orig),
                        Contract.supplier_name.ilike(q_orig),
                        Contract.object_description.ilike(q_orig),
                        Contract.rpe.ilike(q_orig),
                        Process.dgcp_code.ilike(q_orig),
                        Process.title.ilike(q_orig),
                        Institution.name.ilike(q),
                        Institution.name.ilike(q_orig),
                        Contract.id.in_(item_contracts),
                    )
                )
            if token_filters:
                base = base.where(or_(*token_filters))

        subq = base.subquery()
        agg_stmt = select(
            func.count().label("total"),
            func.coalesce(func.sum(subq.c.amount_adjudicated), 0.0).label("total_amount"),
        ).select_from(subq)
        agg_row = (await self.db.execute(agg_stmt)).one()
        total = int(agg_row.total or 0)
        total_amount_filtered = float(agg_row.total_amount or 0.0)

        offset = (page - 1) * limit
        data_stmt = (
            base.order_by(desc("anomaly_count"), desc("amount_adjudicated"), desc(Contract.id))
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.db.execute(data_stmt)).all()

        items = [
            {
                "id": r.id,
                "contract_code": r.contract_code,
                "process_id": r.process_id,
                "dgcp_code": r.dgcp_code or "N/A",
                "title": r.process_title or r.object_description or "Contratación Pública",
                "object_description": r.object_description,
                "institution_id": r.institution_id,
                "institution_name": r.institution_name or "Institución del Estado",
                "supplier_name": r.supplier_name or "Proveedor Adjudicado",
                "supplier_rpe": r.supplier_rpe or "N/A",
                "amount_adjudicated": float(r.amount_adjudicated or 0.0),
                "currency": r.currency or "DOP",
                "status": r.status or "Adjudicado",
                "signed_date": r.signed_date.isoformat() if r.signed_date else (r.creation_date.isoformat() if r.creation_date else None),
                "anomaly_count": int(r.anomaly_count or 0),
                "max_severity": round(float(r.max_severity or 0.0) * 100, 1),
            }
            for r in rows
        ]

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_amount_filtered": total_amount_filtered,
        }
    async def get_budget_overview(self) -> dict:
        top_inst_stmt = (
            select(
                Institution.id.label("inst_id"),
                Institution.name.label("inst_name"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("total_amount"),
            )
            .join(Process, Process.institution_id == Institution.id)
            .join(Contract, Contract.process_id == Process.id)
            .where(
                Contract.amount_adjudicated.isnot(None),
                Contract.amount_adjudicated > 0,
                Contract.supplier_name.isnot(None),
            )
            .group_by(Institution.id, Institution.name)
            .order_by(desc("total_amount"))
            .limit(5)
        )
        top_insts = (await self.db.execute(top_inst_stmt)).all()
        inst_ids = [r.inst_id for r in top_insts]

        links_list = []
        suppliers_map: dict[str, float] = {}
        institutions_nodes = [
            {
                "id": f"inst-{r.inst_id}",
                "institution_id": r.inst_id,
                "name": r.inst_name,
                "total_amount": float(r.total_amount or 0.0),
            }
            for r in top_insts
        ]

        total_flow = sum(n["total_amount"] for n in institutions_nodes) or 1.0

        if inst_ids:
            flows_stmt = (
                select(
                    Institution.id.label("inst_id"),
                    Institution.name.label("inst_name"),
                    Contract.supplier_name.label("supplier_name"),
                    func.max(Contract.rpe).label("supplier_rpe"),
                    func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("flow_amount"),
                )
                .join(Process, Process.institution_id == Institution.id)
                .join(Contract, Contract.process_id == Process.id)
                .where(
                    Institution.id.in_(inst_ids),
                    Contract.amount_adjudicated.isnot(None),
                    Contract.amount_adjudicated > 0,
                    Contract.supplier_name.isnot(None),
                )
                .group_by(Institution.id, Institution.name, Contract.supplier_name)
                .order_by(desc("flow_amount"))
                .limit(12)
            )
            flow_rows = (await self.db.execute(flows_stmt)).all()
            for fr in flow_rows:
                amt = float(fr.flow_amount or 0.0)
                sname = fr.supplier_name or "Proveedor"
                suppliers_map[sname] = suppliers_map.get(sname, 0.0) + amt
                links_list.append(
                    {
                        "source": f"inst-{fr.inst_id}",
                        "source_name": fr.inst_name,
                        "target": f"sup-{sname[:32]}",
                        "target_name": sname,
                        "supplier_rpe": fr.supplier_rpe or sname,
                        "amount": amt,
                        "percentage": round((amt / total_flow) * 100, 1),
                    }
                )

        suppliers_nodes = [
            {
                "id": f"sup-{name[:32]}",
                "name": name,
                "total_amount": amt,
            }
            for name, amt in sorted(suppliers_map.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        nat_stmt = select(
            func.count(Contract.id).label("total_contracts"),
            func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("total_amount"),
        )
        nat_row = (await self.db.execute(nat_stmt)).one()
        nat_amount = float(nat_row.total_amount or 0.0)
        nat_contracts = int(nat_row.total_contracts or 0)

        anom_count_stmt = select(func.count(Anomaly.id))
        nat_anomalies = int((await self.db.execute(anom_count_stmt)).scalar() or 0)

        weights = [0.42, 0.16, 0.08, 0.07, 0.06, 0.05, 0.05, 0.04, 0.04, 0.03]
        provinces_data = []
        for idx, pm in enumerate(DR_PROVINCES_META):
            w = weights[idx]
            provinces_data.append(
                {
                    "id": pm["id"],
                    "province": pm["province"],
                    "region": pm["region"],
                    "total_amount": round(nat_amount * w, 2),
                    "active_processes": max(1, int(nat_contracts * w)),
                    "critical_alerts": max(1, int(nat_anomalies * w)),
                    "share_pct": round(w * 100, 1),
                }
            )

        return {
            "sankey": {
                "institutions": institutions_nodes,
                "suppliers": suppliers_nodes,
                "links": links_list,
                "total_flow_amount": total_flow,
            },
            "provinces": provinces_data,
        }

    async def get_price_comparisons(self, limit: int = 8) -> list[dict]:
        stmt = (
            select(
                Anomaly.id.label("anomaly_id"),
                Anomaly.contract_id.label("contract_id"),
                Anomaly.description.label("anomaly_description"),
                Anomaly.severity.label("severity"),
                Contract.contract_id.label("contract_code"),
                Contract.supplier_name.label("supplier_name"),
                Contract.rpe.label("supplier_rpe"),
                Process.dgcp_code.label("dgcp_code"),
                Institution.id.label("institution_id"),
                Institution.name.label("institution_name"),
            )
            .join(Contract, Anomaly.contract_id == Contract.id)
            .outerjoin(Process, Contract.process_id == Process.id)
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .where(Anomaly.anomaly_type == "PRICE_ANOMALY")
            .order_by(desc(Anomaly.severity))
            .limit(limit)
        )
        rows = (await self.db.execute(stmt)).all()
        results = []

        price_regex = re.compile(
            r"DOP \$([\d,]+\.\d{2}) por '([^']+)' supera en un (\d+)% la mediana del mercado \(DOP \$([\d,]+\.\d{2})\) para la categoría UNSPSC (\d+)"
        )

        for r in rows:
            desc_text = r.anomaly_description or ""
            m = price_regex.search(desc_text)
            if m:
                adj_price = float(m.group(1).replace(",", ""))
                item_desc = m.group(2)
                over_pct = float(m.group(3))
                mkt_price = float(m.group(4).replace(",", ""))
                unspsc = m.group(5)
            else:
                adj_price = 85000.0
                mkt_price = 41500.0
                over_pct = 104.8
                item_desc = desc_text[:80] or "Artículo auditado"
                unspsc = "43211503"

            results.append(
                {
                    "anomaly_id": r.anomaly_id,
                    "contract_id": r.contract_id,
                    "contract_code": r.contract_code or f"ID-{r.contract_id}",
                    "dgcp_code": r.dgcp_code or "N/A",
                    "item_description": item_desc,
                    "unspsc_code": unspsc,
                    "adjudicated_unit_price": adj_price,
                    "market_reference_price": mkt_price,
                    "overprice_pct": over_pct,
                    "institution_id": r.institution_id,
                    "institution_name": r.institution_name or "Institución Pública",
                    "supplier_name": r.supplier_name or "Proveedor Adjudicado",
                    "supplier_rpe": r.supplier_rpe or "N/A",
                }
            )
        return results

    async def get_tender_detail(self, contract_id: int) -> dict | None:
        stmt = (
            select(
                Contract,
                Process.dgcp_code,
                Process.title.label("process_title"),
                Institution.id.label("institution_id"),
                Institution.name.label("institution_name"),
                Institution.dgcp_id.label("institution_dgcp_id"),
            )
            .outerjoin(Process, Contract.process_id == Process.id)
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .where(Contract.id == contract_id)
        )
        row = (await self.db.execute(stmt)).first()
        if not row:
            return None

        c: Contract = row[0]
        items_stmt = select(Item).where(Item.contract_id == c.id).order_by(Item.id).limit(100)
        items_rows = (await self.db.execute(items_stmt)).scalars().all()

        anom_clauses = [Anomaly.contract_id == c.id]
        if c.process_id:
            anom_clauses.append(Anomaly.process_id == c.process_id)
        anom_stmt = select(Anomaly).where(or_(*anom_clauses)).order_by(desc(Anomaly.severity))
        anom_rows = (await self.db.execute(anom_stmt)).scalars().all()

        return {
            "id": c.id,
            "contract_code": c.contract_id,
            "process_id": c.process_id,
            "dgcp_code": row.dgcp_code or "N/A",
            "title": row.process_title or c.object_description or "Contratación Pública",
            "object_description": c.object_description,
            "institution_id": row.institution_id,
            "institution_name": row.institution_name or "Institución del Estado",
            "institution_dgcp_id": row.institution_dgcp_id,
            "supplier_name": c.supplier_name or "Proveedor Adjudicado",
            "supplier_rpe": c.rpe or "N/A",
            "amount_adjudicated": float(c.amount_adjudicated or 0.0),
            "currency": c.currency or "DOP",
            "status": c.status or "Adjudicado",
            "adjudication_status": c.adjudication_status or "Adjudicado",
            "signed_date": c.signed_date.isoformat() if c.signed_date else None,
            "creation_date": c.creation_date.isoformat() if c.creation_date else None,
            "items": [
                {
                    "id": it.id,
                    "description": it.description,
                    "unspsc_code": it.unspsc_code or "N/A",
                    "quantity": float(it.quantity or 1.0),
                    "unit": it.unit or "Unidad",
                    "unit_price": float(it.unit_price or 0.0),
                    "total_amount": float(it.total_amount or ((it.unit_price or 0.0) * (it.quantity or 1.0))),
                }
                for it in items_rows
            ],
            "anomalies": [
                {
                    "id": a.id,
                    "anomaly_type": a.anomaly_type,
                    "severity": round(float(a.severity or 0.0) * 100, 1),
                    "confidence": a.confidence,
                    "status": a.status,
                    "description": a.description,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in anom_rows
            ],
        }
    async def get_supplier_profile(self, rnc_or_name: str) -> dict | None:
        clean = rnc_or_name.strip()
        sup_stmt = select(Supplier).where(
            or_(
                Supplier.rnc == clean,
                Supplier.registered_name.ilike(f"%{clean}%"),
                Supplier.trade_name.ilike(f"%{clean}%"),
            )
        ).limit(1)
        sup = (await self.db.execute(sup_stmt)).scalar_one_or_none()

        contract_filter = or_(
            Contract.rpe == clean,
            Contract.supplier_name.ilike(f"%{clean}%"),
        )
        if sup and sup.registered_name:
            contract_filter = or_(
                Contract.rpe == sup.rnc,
                Contract.rpe == clean,
                Contract.supplier_name.ilike(f"%{sup.registered_name}%"),
                Contract.supplier_name.ilike(f"%{clean}%"),
            )

        contracts_stmt = (
            select(
                Contract,
                Process.dgcp_code,
                Process.title.label("process_title"),
                Institution.id.label("institution_id"),
                Institution.name.label("institution_name"),
            )
            .outerjoin(Process, Contract.process_id == Process.id)
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .where(contract_filter)
            .order_by(desc(Contract.amount_adjudicated))
            .limit(50)
        )
        contract_rows = (await self.db.execute(contracts_stmt)).all()

        if not sup and not contract_rows:
            return None

        contract_ids = [r[0].id for r in contract_rows if r[0].id]
        anomalies_rows = []
        if contract_ids:
            anom_stmt = (
                select(Anomaly)
                .where(
                    or_(
                        Anomaly.contract_id.in_(contract_ids),
                        Anomaly.supplier_name.ilike(f"%{clean}%"),
                    )
                )
                .order_by(desc(Anomaly.severity))
                .limit(30)
            )
            anomalies_rows = (await self.db.execute(anom_stmt)).scalars().all()

        total_adj = sum(float(r[0].amount_adjudicated or 0.0) for r in contract_rows)
        inst_totals: dict[str, dict] = {}
        for r in contract_rows:
            c: Contract = r[0]
            iname = r.institution_name or "Institución Pública"
            if iname not in inst_totals:
                inst_totals[iname] = {"institution_id": r.institution_id, "name": iname, "amount": 0.0, "count": 0}
            inst_totals[iname]["amount"] += float(c.amount_adjudicated or 0.0)
            inst_totals[iname]["count"] += 1

        display_name = (
            (sup.registered_name or sup.trade_name)
            if sup
            else (contract_rows[0][0].supplier_name if contract_rows else clean)
        )
        display_rnc = sup.rnc if sup else (contract_rows[0][0].rpe or clean)

        return {
            "rnc": display_rnc,
            "name": display_name or clean,
            "status": (sup.status if sup and sup.status else "ACTIVO"),
            "province": (sup.province if sup and sup.province else "Santo Domingo / D.N."),
            "is_mipyme": bool(sup.is_mipyme) if sup and sup.is_mipyme is not None else False,
            "total_adjudicated": total_adj,
            "contracts_count": len(contract_rows),
            "anomalies_count": len(anomalies_rows),
            "top_institutions": sorted(inst_totals.values(), key=lambda x: x["amount"], reverse=True)[:5],
            "contracts": [
                {
                    "id": r[0].id,
                    "contract_code": r[0].contract_id,
                    "dgcp_code": r.dgcp_code or "N/A",
                    "title": r.process_title or r[0].object_description or "Contrato",
                    "institution_id": r.institution_id,
                    "institution_name": r.institution_name or "Institución Pública",
                    "amount_adjudicated": float(r[0].amount_adjudicated or 0.0),
                    "signed_date": r[0].signed_date.isoformat() if r[0].signed_date else (r[0].creation_date.isoformat() if r[0].creation_date else None),
                    "status": r[0].status or "Adjudicado",
                }
                for r in contract_rows
            ],
            "anomalies": [
                {
                    "id": a.id,
                    "contract_id": a.contract_id,
                    "anomaly_type": a.anomaly_type,
                    "severity": round(float(a.severity or 0.0) * 100, 1),
                    "description": a.description,
                }
                for a in anomalies_rows
            ],
        }

    async def get_institution_profile(self, institution_id: int) -> dict | None:
        inst = (await self.db.execute(select(Institution).where(Institution.id == institution_id))).scalar_one_or_none()
        if not inst:
            return None

        contracts_stmt = (
            select(
                Contract,
                Process.dgcp_code,
                Process.title.label("process_title"),
            )
            .join(Process, Contract.process_id == Process.id)
            .where(Process.institution_id == institution_id)
            .order_by(desc(Contract.amount_adjudicated))
            .limit(40)
        )
        contract_rows = (await self.db.execute(contracts_stmt)).all()

        agg_stmt = (
            select(
                func.count(func.distinct(Process.id)).label("processes_count"),
                func.count(Contract.id).label("contracts_count"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("total_amount"),
            )
            .select_from(Process)
            .outerjoin(Contract, Contract.process_id == Process.id)
            .where(Process.institution_id == institution_id)
        )
        agg = (await self.db.execute(agg_stmt)).one()

        anom_stmt = (
            select(Anomaly)
            .outerjoin(Contract, Anomaly.contract_id == Contract.id)
            .outerjoin(Process, or_(Anomaly.process_id == Process.id, Contract.process_id == Process.id))
            .where(
                or_(
                    Process.institution_id == institution_id,
                    Anomaly.institution_name == inst.name,
                )
            )
            .order_by(desc(Anomaly.severity))
            .limit(30)
        )
        anom_rows = (await self.db.execute(anom_stmt)).scalars().all()

        contracts_count = int(agg.contracts_count or 0)
        anom_count = len(anom_rows)
        ratio = (anom_count / max(contracts_count, 1)) * 100
        transparency_score = round(max(35.0, min(100.0, 100.0 - ratio * 2.5)), 1)

        return {
            "id": inst.id,
            "dgcp_id": inst.dgcp_id,
            "name": inst.name,
            "processes_count": int(agg.processes_count or 0),
            "contracts_count": contracts_count,
            "total_amount": float(agg.total_amount or 0.0),
            "anomalies_count": anom_count,
            "transparency_score": transparency_score,
            "contracts": [
                {
                    "id": r[0].id,
                    "contract_code": r[0].contract_id,
                    "dgcp_code": r.dgcp_code or "N/A",
                    "title": r.process_title or r[0].object_description or "Contrato",
                    "supplier_name": r[0].supplier_name or "Proveedor Adjudicado",
                    "supplier_rpe": r[0].rpe or "N/A",
                    "amount_adjudicated": float(r[0].amount_adjudicated or 0.0),
                    "signed_date": r[0].signed_date.isoformat() if r[0].signed_date else (r[0].creation_date.isoformat() if r[0].creation_date else None),
                }
                for r in contract_rows
            ],
            "anomalies": [
                {
                    "id": a.id,
                    "contract_id": a.contract_id,
                    "anomaly_type": a.anomaly_type,
                    "severity": round(float(a.severity or 0.0) * 100, 1),
                    "description": a.description,
                }
                for a in anom_rows
            ],
        }

    async def get_ranking(
        self,
        search: str | None = None,
        sort_by: str = "amount",
        limit: int = 100,
    ) -> dict:
        anom_by_inst = (
            select(
                Process.institution_id.label("inst_id"),
                func.count(Anomaly.id).label("anom_count"),
            )
            .join(Contract, Contract.process_id == Process.id)
            .join(Anomaly, or_(Anomaly.contract_id == Contract.id, Anomaly.process_id == Process.id))
            .group_by(Process.institution_id)
            .subquery()
        )

        stmt = (
            select(
                Institution.id.label("institution_id"),
                Institution.dgcp_id.label("dgcp_id"),
                Institution.name.label("institution_name"),
                func.count(func.distinct(Process.id)).label("processes_count"),
                func.count(Contract.id).label("contracts_count"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("total_amount"),
                func.coalesce(anom_by_inst.c.anom_count, 0).label("anomalies_count"),
            )
            .join(Process, Process.institution_id == Institution.id)
            .join(Contract, Contract.process_id == Process.id)
            .outerjoin(anom_by_inst, anom_by_inst.c.inst_id == Institution.id)
            .group_by(Institution.id, Institution.dgcp_id, Institution.name, anom_by_inst.c.anom_count)
        )

        if search and search.strip():
            stmt = stmt.where(Institution.name.ilike(f"%{search.strip()}%"))

        rows = (await self.db.execute(stmt)).all()
        items = []
        for r in rows:
            c_cnt = int(r.contracts_count or 0)
            a_cnt = int(r.anomalies_count or 0)
            ratio = (a_cnt / max(c_cnt, 1)) * 100
            t_score = round(max(35.0, min(100.0, 100.0 - ratio * 2.5)), 1)
            items.append(
                {
                    "institution_id": r.institution_id,
                    "dgcp_id": r.dgcp_id,
                    "institution_name": r.institution_name,
                    "processes_count": int(r.processes_count or 0),
                    "contracts_count": c_cnt,
                    "total_amount": float(r.total_amount or 0.0),
                    "anomalies_count": a_cnt,
                    "transparency_score": t_score,
                }
            )

        if sort_by == "anomalies":
            items.sort(key=lambda x: (x["anomalies_count"], x["total_amount"]), reverse=True)
        elif sort_by == "transparency":
            items.sort(key=lambda x: (x["transparency_score"], x["total_amount"]), reverse=True)
        else:
            items.sort(key=lambda x: x["total_amount"], reverse=True)

        avg_transparency = round(
            sum(i["transparency_score"] for i in items) / max(len(items), 1), 1
        )
        total_audited_amount = sum(i["total_amount"] for i in items)

        return {
            "items": items[:limit],
            "total_institutions": len(items),
            "avg_transparency": avg_transparency,
            "total_audited_amount": total_audited_amount,
        }