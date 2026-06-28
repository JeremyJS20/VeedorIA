import asyncio
import logging
import re
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
from datetime import UTC, datetime, timedelta

import networkx as nx
import numpy as np
from rapidfuzz import fuzz
from sklearn.ensemble import IsolationForest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import desc

from src.models.anomaly import Anomaly, AnomalyStatus
from src.models.audit_log import AuditLog
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.supplier import Supplier

logger = logging.getLogger("veedoria.services.anomaly_service")

ml_executor = ProcessPoolExecutor(max_workers=2)

FRAGMENTATION_WINDOW_DAYS = 30
FRAGMENTATION_THRESHOLD_DOP = 8_000_000
COLLUSION_NAME_SIMILARITY = 0.85
COLLUSION_MAX_FUZZY_PAIRS = 500_000
IF_MIN_ITEMS = 30
IF_CONTAMINATION = 0.05
IF_N_ESTIMATORS = 100
IF_RANDOM_STATE = 42
ZSCORE_THRESHOLD = 2.5
BANNED_EMAIL_DOMAINS = {"gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "aol.com"}


def _compute_if_scores(prices: list[float]) -> list[float]:
    if len(prices) < 4:
        return [0.0] * len(prices)
    X = np.array(prices).reshape(-1, 1)
    model = IsolationForest(
        contamination=IF_CONTAMINATION,
        n_estimators=IF_N_ESTIMATORS,
        random_state=IF_RANDOM_STATE,
    )
    model.fit(X)
    return model.decision_function(X).tolist()


def _compute_z_scores(prices: list[float]) -> list[float]:
    arr = np.array(prices)
    mean = np.mean(arr)
    std = np.std(arr)
    if std == 0:
        return [0.0] * len(prices)
    return ((arr - mean) / std).tolist()


class AnomalyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def detect_price_anomalies(self) -> int:
        stmt = select(Item).where(
            Item.unit_price.isnot(None),
            Item.unit_price > 0,
            Item.unspsc_code.isnot(None),
        )
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        existing_price = await self.db.execute(
            select(Anomaly.contract_id).where(Anomaly.anomaly_type == "PRICE_ANOMALY")
        )
        seen_contracts: set[int] = {r[0] for r in existing_price.all() if r[0] is not None}

        contract_ids_in_items = {it.contract_id for it in items if it.contract_id}
        contracts: dict[int, Contract] = {}
        if contract_ids_in_items:
            r = await self.db.execute(select(Contract).where(Contract.id.in_(contract_ids_in_items)))
            contracts = {c.id: c for c in r.scalars().all()}

        proc_ids = {c.process_id for c in contracts.values() if c.process_id}
        processes: dict[int, Process] = {}
        if proc_ids:
            r = await self.db.execute(select(Process).where(Process.id.in_(proc_ids)))
            processes = {p.id: p for p in r.scalars().all()}

        inst_ids = {p.institution_id for p in processes.values() if p.institution_id}
        institutions: dict[int, Institution] = {}
        if inst_ids:
            r = await self.db.execute(select(Institution).where(Institution.id.in_(inst_ids)))
            institutions = {i.id: i for i in r.scalars().all()}

        groups: dict[str, list[Item]] = defaultdict(list)
        for item in items:
            groups[item.unspsc_code].append(item)

        created = 0
        loop = asyncio.get_running_loop()

        for unspsc_code, group in groups.items():
            prices = [it.unit_price for it in group if it.unit_price and it.unit_price > 0]
            if len(prices) < 4:
                continue

            if len(prices) >= IF_MIN_ITEMS:
                scores = await loop.run_in_executor(ml_executor, _compute_if_scores, prices)
            else:
                raw = _compute_z_scores(prices)
                scores = [-s / max(abs(s), 1) for s in raw]

            median_price = float(np.median(prices))

            for item, score in zip(group, scores):
                is_anomaly = score < 0 if len(prices) >= IF_MIN_ITEMS else abs(score) > ZSCORE_THRESHOLD / max(abs(score), 1)
                if not is_anomaly:
                    continue
                if item.contract_id in seen_contracts:
                    continue

                deviation_pct = ((item.unit_price - median_price) / median_price * 100) if median_price > 0 else 0
                direction = "supera" if deviation_pct > 0 else "está por debajo"
                description = (
                    f"Precio unitario de DOP ${item.unit_price:,.2f} por '{item.description}' "
                    f"{direction} en un {abs(deviation_pct):.0f}% la mediana del mercado "
                    f"(DOP ${median_price:,.2f}) para la categoría UNSPSC {unspsc_code}."
                )

                c = contracts.get(item.contract_id)
                p = processes.get(c.process_id) if c and c.process_id else None
                inst = institutions.get(p.institution_id) if p and p.institution_id else None

                anomaly = Anomaly(
                    contract_id=item.contract_id,
                    amount=c.amount_adjudicated if c else None,
                    supplier_name=c.supplier_name if c else None,
                    process_code=p.dgcp_code if p else None,
                    institution_name=inst.name if inst else None,
                    anomaly_type="PRICE_ANOMALY",
                    severity=min(abs(score), 1.0),
                    score=float(score),
                    description=description[:2000],
                )
                self.db.add(anomaly)
                seen_contracts.add(item.contract_id)
                created += 1

        await self.db.commit()
        logger.info("Price anomaly detection: %d anomalies created", created)
        return created

    async def detect_fragmentation(self) -> int:
        cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=FRAGMENTATION_WINDOW_DAYS)

        process_result = await self.db.execute(select(Process))
        processes = {p.id: p for p in process_result.scalars().all()}
        process_map = {p.id: p.institution_id for p in processes.values()}

        inst_ids = {p.institution_id for p in processes.values() if p.institution_id}
        institutions: dict[int, Institution] = {}
        if inst_ids:
            r = await self.db.execute(select(Institution).where(Institution.id.in_(inst_ids)))
            institutions = {i.id: i for i in r.scalars().all()}

        stmt = (
            select(Contract)
            .where(Contract.creation_date >= cutoff, Contract.amount_adjudicated.isnot(None))
            .order_by(Contract.creation_date)
        )
        result = await self.db.execute(stmt)
        contracts = result.scalars().all()

        inst_groups: dict[int | None, list[Contract]] = defaultdict(list)
        for c in contracts:
            inst_groups[process_map.get(c.process_id)].append(c)

        created = 0

        for inst_id, group in inst_groups.items():
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    ci, cj = group[i], group[j]
                    if ci.amount_adjudicated is None or cj.amount_adjudicated is None:
                        continue
                    combined = ci.amount_adjudicated + cj.amount_adjudicated
                    if combined < FRAGMENTATION_THRESHOLD_DOP:
                        continue

                    items_i = await self.db.execute(
                        select(Item).where(Item.contract_id == ci.id)
                    )
                    items_j = await self.db.execute(
                        select(Item).where(Item.contract_id == cj.id)
                    )
                    descs_i = [it.description for it in items_i.scalars().all() if it.description]
                    descs_j = [it.description for it in items_j.scalars().all() if it.description]

                    similar = False
                    for di in descs_i:
                        for dj in descs_j:
                            if fuzz.ratio(di, dj) >= 70:
                                similar = True
                                break
                        if similar:
                            break

                    if not similar:
                        continue

                    exists = await self.db.execute(
                        select(Anomaly).where(
                            Anomaly.process_id == ci.process_id,
                            Anomaly.anomaly_type == "FRAGMENTATION",
                        )
                    )
                    if exists.scalar_one_or_none():
                        continue

                    severity = min((combined - FRAGMENTATION_THRESHOLD_DOP) / FRAGMENTATION_THRESHOLD_DOP, 1.0)
                    desc = (
                        f"Posible fraccionamiento: contratos {ci.contract_id} y {cj.contract_id} "
                        f"suman DOP ${combined:,.2f} superando el umbral de licitación "
                        f"(DOP ${FRAGMENTATION_THRESHOLD_DOP:,.2f}) con ítems de descripción similar."
                    )

                    p = processes.get(ci.process_id)
                    inst = institutions.get(p.institution_id) if p and p.institution_id else None

                    anomaly = Anomaly(
                        process_id=ci.process_id,
                        contract_id=ci.id,
                        amount=ci.amount_adjudicated,
                        supplier_name=ci.supplier_name,
                        process_code=p.dgcp_code if p else None,
                        institution_name=inst.name if inst else None,
                        anomaly_type="FRAGMENTATION",
                        severity=severity,
                        score=float(severity),
                        description=desc[:2000],
                    )
                    self.db.add(anomaly)
                    created += 1

        await self.db.commit()
        logger.info("Fragmentation detection: %d anomalies created", created)
        return created

    async def detect_collusion(self) -> int:
        result = await self.db.execute(select(Supplier))
        suppliers = result.scalars().all()

        if len(suppliers) < 3:
            logger.info("Collusion: too few suppliers (%d), skipping", len(suppliers))
            return 0

        G = nx.Graph()

        for s in suppliers:
            G.add_node(s.id, rnc=s.rnc, name=s.registered_name or s.trade_name or "")

        phone_map: dict[str, list[int]] = defaultdict(list)
        email_domain_map: dict[str, list[int]] = defaultdict(list)

        for s in suppliers:
            if s.phone:
                clean = "".join(c for c in s.phone if c.isdigit())
                if len(clean) >= 7:
                    phone_map[clean].append(s.id)

            if s.email and "@" in s.email:
                domain = s.email.split("@")[1].lower()
                if domain not in BANNED_EMAIL_DOMAINS:
                    email_domain_map[domain].append(s.id)

        for phone, ids in phone_map.items():
            if len(ids) >= 2:
                for i in range(len(ids)):
                    for j in range(i + 1, len(ids)):
                        if not G.has_edge(ids[i], ids[j]):
                            G.add_edge(ids[i], ids[j], weight=0.8, reason="shared_phone")

        for domain, ids in email_domain_map.items():
            if len(ids) >= 2:
                for i in range(len(ids)):
                    for j in range(i + 1, len(ids)):
                        existing = G.get_edge_data(ids[i], ids[j])
                        w = 0.6
                        if existing:
                            w = max(existing.get("weight", 0), 0.6)
                        G.add_edge(ids[i], ids[j], weight=w, reason="shared_domain")

        suppliers_in_graph = {n for n in G.nodes() if G.degree(n) > 0}
        fuzzy_candidates = [s for s in suppliers if s.id in suppliers_in_graph]
        if len(fuzzy_candidates) == 0:
            fuzzy_candidates = list(suppliers)
        loop = asyncio.get_event_loop()
        fuzzy_pairs_checked = 0
        for i in range(len(fuzzy_candidates)):
            if fuzzy_pairs_checked >= COLLUSION_MAX_FUZZY_PAIRS:
                logger.info("Collusion fuzzy: reached max pairs (%d), stopping early", COLLUSION_MAX_FUZZY_PAIRS)
                break
            for j in range(i + 1, len(fuzzy_candidates)):
                if fuzzy_pairs_checked >= COLLUSION_MAX_FUZZY_PAIRS:
                    break
                fuzzy_pairs_checked += 1
                si, sj = fuzzy_candidates[i], fuzzy_candidates[j]
                name_i = (si.registered_name or si.trade_name or "")
                name_j = (sj.registered_name or sj.trade_name or "")
                if not name_i or not name_j:
                    continue
                ratio = await loop.run_in_executor(None, lambda a=name_i, b=name_j: fuzz.ratio(a, b) / 100.0)
                if ratio >= COLLUSION_NAME_SIMILARITY:
                    existing = G.get_edge_data(si.id, sj.id)
                    w = ratio
                    if existing:
                        w = max(existing.get("weight", 0), ratio)
                    G.add_edge(si.id, sj.id, weight=w, reason="similar_name")

        if G.number_of_edges() == 0:
            logger.info("Collusion: no suspicious links found")
            return 0

        try:
            communities = nx.community.louvain_communities(G, seed=42)
        except ImportError:
            communities = [list(c) for c in nx.connected_components(G)]

        created = 0
        seen_pairs: set[tuple[int, int]] = set()

        for community in communities:
            if len(community) < 2:
                continue
            subgraph = G.subgraph(community)
            density = nx.density(subgraph)
            if density < 0.3:
                continue

            member_ids = list(community)
            for i in range(len(member_ids)):
                for j in range(i + 1, len(member_ids)):
                    pair = (member_ids[i], member_ids[j])
                    if pair in seen_pairs:
                        continue
                    seen_pairs.add(pair)

                    s_a = next((s for s in suppliers if s.id == member_ids[i]), None)
                    s_b = next((s for s in suppliers if s.id == member_ids[j]), None)
                    if not s_a or not s_b:
                        continue

                    edge_data = G.get_edge_data(member_ids[i], member_ids[j])
                    reason = edge_data.get("reason", "unknown") if edge_data else "unknown"

                    exists = await self.db.execute(
                        select(Anomaly).where(
                            Anomaly.description.contains(s_a.rnc),
                            Anomaly.description.contains(s_b.rnc),
                            Anomaly.anomaly_type == "COLLUSION",
                        )
                    )
                    if exists.scalar_one_or_none():
                        continue

                    desc = (
                        f"Posible colusión entre '{s_a.registered_name or s_a.trade_name}' (RNC: {s_a.rnc}) "
                        f"y '{s_b.registered_name or s_b.trade_name}' (RNC: {s_b.rnc}). "
                        f"Vínculo detectado: {reason.replace('_', ' ')}."
                    )

                    anomaly = Anomaly(
                        anomaly_type="COLLUSION",
                        severity=min(density, 1.0),
                        score=float(density),
                        description=desc[:2000],
                    )
                    self.db.add(anomaly)
                    created += 1

        await self.db.commit()
        logger.info("Collusion detection: %d anomalies created", created)
        return created

    async def run_full_detection(self) -> dict:
        price_count = await self.detect_price_anomalies()
        frag_count = await self.detect_fragmentation()
        coll_count = await self.detect_collusion()
        return {
            "price_anomalies": price_count,
            "fragmentation": frag_count,
            "collusion": coll_count,
        }

    async def get_anomalies(
        self,
        anomaly_type: str | None = None,
        status: str | None = None,
        min_severity: float | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Anomaly], int]:
        base = select(Anomaly)
        if anomaly_type:
            base = base.where(Anomaly.anomaly_type == anomaly_type)
        if status:
            base = base.where(Anomaly.status == status)
        if min_severity is not None:
            base = base.where(Anomaly.severity >= min_severity)

        count_stmt = select(func.count()).select_from(base.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar()

        stmt = base.order_by(desc(Anomaly.severity), desc(Anomaly.created_at))
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())
        await self._enrich_anomalies(items)
        return items, total

    async def _enrich_anomalies(self, items: list[Anomaly]) -> None:
        contract_ids = {a.contract_id for a in items if a.contract_id}
        process_ids = {a.process_id for a in items if a.process_id}

        contracts: dict[int, Contract] = {}
        if contract_ids:
            result = await self.db.execute(select(Contract).where(Contract.id.in_(contract_ids)))
            contracts = {c.id: c for c in result.scalars().all()}
            for c in contracts.values():
                if c.process_id:
                    process_ids.add(c.process_id)

        processes: dict[int, Process] = {}
        if process_ids:
            result = await self.db.execute(select(Process).where(Process.id.in_(process_ids)))
            processes = {p.id: p for p in result.scalars().all()}

        inst_ids = {p.institution_id for p in processes.values() if p.institution_id}
        institutions: dict[int, Institution] = {}
        if inst_ids:
            result = await self.db.execute(select(Institution).where(Institution.id.in_(inst_ids)))
            institutions = {i.id: i for i in result.scalars().all()}

        for a in items:
            contract = contracts.get(a.contract_id) if a.contract_id else None
            process = processes.get(a.process_id) if a.process_id else None
            if not process and contract and contract.process_id:
                process = processes.get(contract.process_id)
            if contract:
                a.amount = contract.amount_adjudicated
                a.supplier_name = contract.supplier_name
            if process:
                a.process_code = process.dgcp_code
                inst = institutions.get(process.institution_id) if process.institution_id else None
                if inst:
                    a.institution_name = inst.name

    async def get_anomaly(self, anomaly_id: str) -> Anomaly | None:
        result = await self.db.execute(select(Anomaly).where(Anomaly.id == anomaly_id))
        return result.scalar_one_or_none()

    async def get_anomaly_stats(self) -> dict:
        result = await self.db.execute(text("""
            SELECT anomaly_type, COUNT(*) as cnt
            FROM anomaly
            GROUP BY anomaly_type
        """))
        type_rows = result.all()

        result = await self.db.execute(text("""
            SELECT status, COUNT(*) as cnt
            FROM anomaly
            GROUP BY status
        """))
        status_rows = result.all()

        result = await self.db.execute(text("""
            SELECT COALESCE(AVG(severity), 0.0) as avg_sev
            FROM anomaly
        """))
        avg_row = result.one()

        total = sum(r.cnt for r in status_rows)

        return {
            "total": total,
            "total_by_type": {r.anomaly_type: r.cnt for r in type_rows},
            "total_by_status": {r.status: r.cnt for r in status_rows},
            "avg_severity": float(avg_row.avg_sev),
        }

    async def get_anomaly_context(self, anomaly_id: str) -> dict | None:
        anomaly = await self.get_anomaly(anomaly_id)
        if not anomaly:
            return None

        await self._enrich_anomalies([anomaly])

        contract: Contract | None = None
        process: Process | None = None
        if anomaly.contract_id:
            r = await self.db.execute(select(Contract).where(Contract.id == anomaly.contract_id))
            contract = r.scalar_one_or_none()
        if anomaly.process_id:
            r = await self.db.execute(select(Process).where(Process.id == anomaly.process_id))
            process = r.scalar_one_or_none()

        inst_name = anomaly.institution_name
        process_code = anomaly.process_code

        market_prices: list[dict] = []
        recent_contracts: list[dict] = []

        if anomaly.anomaly_type == "PRICE_ANOMALY" and contract:
            item_result = await self.db.execute(
                select(Item).where(Item.contract_id == contract.id).limit(1)
            )
            target_item = item_result.scalar_one_or_none()
            if target_item and target_item.unspsc_code:
                items_result = await self.db.execute(
                    select(Item).where(
                        Item.unspsc_code == target_item.unspsc_code,
                        Item.unit_price.isnot(None),
                        Item.unit_price > 0,
                    )
                )
                same_category = items_result.scalars().all()
                prices = sorted(set(it.unit_price for it in same_category if it.unit_price))
                market_prices = [
                    {
                        "contract_id": it.contract_id,
                        "supplier_name": None,
                        "unit_price": it.unit_price,
                        "is_anomaly": it.contract_id == anomaly.contract_id,
                        "description": it.description,
                    }
                    for it in same_category
                ]
                if contract.supplier_name:
                    for mp in market_prices:
                        if mp["contract_id"] == contract.id:
                            mp["supplier_name"] = contract.supplier_name

        if anomaly.anomaly_type == "FRAGMENTATION" and process and process.institution_id:
            cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=90)
            proc_result = await self.db.execute(
                select(Process).where(Process.institution_id == process.institution_id)
            )
            inst_process_ids = [p.id for p in proc_result.scalars().all()]
            if inst_process_ids:
                c_result = await self.db.execute(
                    select(Contract)
                    .where(
                        Contract.process_id.in_(inst_process_ids),
                        Contract.creation_date.isnot(None),
                        Contract.creation_date >= cutoff,
                        Contract.amount_adjudicated.isnot(None),
                    )
                    .order_by(Contract.creation_date.desc())
                    .limit(10)
                )
                recent = c_result.scalars().all()
                recent_contracts = [
                    {
                        "date": str(c.creation_date.date()),
                        "reference": c.contract_id or f"ID-{c.id}",
                        "title": c.object_description or c.supplier_name or "Contrato",
                        "amount": c.amount_adjudicated,
                        "is_alert": c.id == anomaly.contract_id,
                        "alert_message": (
                            "Contrato vinculado a esta alerta de fraccionamiento."
                            if c.id == anomaly.contract_id
                            else None
                        ),
                    }
                    for c in recent
                ]

        collusion_links: list[dict] = []

        if anomaly.anomaly_type == "COLLUSION":
            coll_result = await self.db.execute(
                select(Anomaly).where(Anomaly.anomaly_type == "COLLUSION")
            )
            all_coll = coll_result.scalars().all()
            seen_pairs: set[tuple[str, str]] = set()
            for coll in all_coll:
                desc = coll.description or ""
                m = re.match(
                    r"Posible colusión entre '(.+?)' \(RNC: (.+?)\) y '(.+?)' \(RNC: (.+?)\)\. Vínculo detectado: (.+?)\.$",
                    desc,
                )
                if not m:
                    continue
                name_a, rnc_a, name_b, rnc_b, reason = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
                pair = tuple(sorted([rnc_a, rnc_b]))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                collusion_links.append({
                    "source": name_a,
                    "target": name_b,
                    "reason": reason,
                    "weight": coll.score or coll.severity,
                })

        confidence = min(abs(anomaly.score) * 100 if anomaly.score else anomaly.severity * 100, 99)

        return {
            "anomaly_type": anomaly.anomaly_type,
            "severity": anomaly.severity,
            "score": anomaly.score,
            "confidence": round(confidence, 1),
            "amount": anomaly.amount,
            "process_code": process_code,
            "supplier_name": anomaly.supplier_name,
            "institution_name": inst_name,
            "market_prices": market_prices,
            "recent_contracts": recent_contracts,
            "collusion_links": collusion_links,
        }

    async def review_anomaly(
        self,
        anomaly_id: str,
        reviewer_id: str,
        status: str,
        notes: str | None = None,
    ) -> Anomaly | None:
        anomaly = await self.get_anomaly(anomaly_id)
        if not anomaly:
            return None

        old_status = anomaly.status
        anomaly.status = status
        anomaly.reviewer_id = reviewer_id
        anomaly.updated_at = datetime.now(UTC).replace(tzinfo=None)

        log_entry = AuditLog(
            action_type="ANOMALY_REVIEW",
            user_id=reviewer_id,
            entity_type="anomaly",
            entity_id=anomaly_id,
            old_value={"status": old_status},
            new_value={"status": status, "notes": notes or ""},
        )
        self.db.add(log_entry)
        self.db.add(anomaly)
        await self.db.commit()
        await self.db.refresh(anomaly)
        return anomaly
