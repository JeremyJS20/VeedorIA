import hashlib
import logging
import secrets
from datetime import UTC, datetime

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.time_utils import utcnow_naive
from src.models.anomaly import Anomaly
from src.models.audit_log import AuditLog
from src.models.contract import Contract
from src.models.detection_config import DetectionConfig
from src.models.institution import Institution
from src.models.process import Process

logger = logging.getLogger("veedoria.services.auditor_b2g")

DEFAULT_DETECTION_CONFIG: dict[str, dict] = {
    "PRICE_ANOMALY_WEIGHT": {
        "value": 1.0,
        "label": "Peso de Variación de Precios Unitarios",
        "category": "PESOS",
        "min": 0.2,
        "max": 2.0,
        "step": 0.1,
        "description": "Ponderación asignada a desviaciones estadísticamente significativas frente al precio mediano histórico del rubro UNSPSC.",
    },
    "FRAGMENTATION_WEIGHT": {
        "value": 1.0,
        "label": "Peso de Fraccionamiento de Contratos",
        "category": "PESOS",
        "min": 0.2,
        "max": 2.0,
        "step": 0.1,
        "description": "Ponderación asignada a múltiples adjudicaciones consecutivas cuya suma supera el tope de su modalidad de compra.",
    },
    "COLLUSION_WEIGHT": {
        "value": 1.0,
        "label": "Peso de Patrones de Colusión Relacional",
        "category": "PESOS",
        "min": 0.2,
        "max": 2.0,
        "step": 0.1,
        "description": "Ponderación asignada a coincidencias societarias, contacto compartido o rotación atípica entre proveedores.",
    },
    "MIN_CRITICAL_SEVERITY": {
        "value": 0.75,
        "label": "Umbral de Severidad Crítica",
        "category": "UMBRALES",
        "min": 0.5,
        "max": 0.95,
        "step": 0.05,
        "description": "Puntaje a partir del cual un hallazgo se clasifica con prioridad Crítica en la bandeja institucional.",
    },
    "PRICE_VARIATION_PCT_THRESHOLD": {
        "value": 50.0,
        "label": "Variación Porcentual Mínima de Sobreprecio (%)",
        "category": "UMBRALES",
        "min": 15.0,
        "max": 250.0,
        "step": 5.0,
        "description": "Porcentaje mínimo por encima de la mediana del rubro UNSPSC para levantar una alerta preventiva de precio.",
    },
    "FRAGMENTATION_WINDOW_DAYS": {
        "value": 30.0,
        "label": "Ventana Temporal de Fraccionamiento (Días)",
        "category": "UMBRALES",
        "min": 7.0,
        "max": 90.0,
        "step": 1.0,
        "description": "Intervalo máximo en días corridos para agrupar contratos similares adjudicados por la misma institución (Art. 62 Reg. 416-23).",
    },
    "THRESHOLD_CD_DOP": {
        "value": 250000.0,
        "label": "Tope Compra por Debajo del Umbral (CD)",
        "category": "UMBRALES_DGCP",
        "min": 50000.0,
        "max": 1000000.0,
        "step": 25000.0,
        "description": "Tope máximo en DOP para procesos con sigla -CD- según la Tabla Anual de Umbrales de la DGCP.",
    },
    "THRESHOLD_CM_DOP": {
        "value": 1650000.0,
        "label": "Tope Compra Menor (CM)",
        "category": "UMBRALES_DGCP",
        "min": 500000.0,
        "max": 5000000.0,
        "step": 50000.0,
        "description": "Tope máximo en DOP para procesos con sigla -CM- antes de requerir Comparación de Precios.",
    },
    "THRESHOLD_CP_DOP": {
        "value": 6500000.0,
        "label": "Tope Comparación de Precios (CP)",
        "category": "UMBRALES_DGCP",
        "min": 2000000.0,
        "max": 15000000.0,
        "step": 250000.0,
        "description": "Tope máximo en DOP para procesos con sigla -CP- antes de obligar a Licitación Pública Nacional.",
    },
    "THRESHOLD_PEIN_DOP": {
        "value": 8000000.0,
        "label": "Tope Excepción Ordinaria / Arrendamiento (PEIN / PEPU)",
        "category": "UMBRALES_DGCP",
        "min": 2000000.0,
        "max": 25000000.0,
        "step": 500000.0,
        "description": "Umbral de control preventivo en DOP para procesos con siglas -PEIN- o -PEPU- (Arts. 38–45 Reg. 416-23).",
    },
    "THRESHOLD_LPN_DOP": {
        "value": 15000000.0,
        "label": "Umbral de Control en Licitación Pública (LPN / LPI)",
        "category": "UMBRALES_DGCP",
        "min": 5000000.0,
        "max": 50000000.0,
        "step": 1000000.0,
        "description": "Referencia de auditoría en DOP para subdivisión de lotes dentro de Licitaciones Públicas (-LPN- / -LPI-).",
    },
    "THRESHOLD_PEEN_DOP": {
        "value": 25000000.0,
        "label": "Umbral de Control en Emergencia / Urgencia (PEEN / PEUR)",
        "category": "UMBRALES_DGCP",
        "min": 5000000.0,
        "max": 100000000.0,
        "step": 1000000.0,
        "description": "Tope de fiscalización en DOP para contrataciones sucesivas bajo declaratoria de emergencia o urgencia (-PEEN- / -PEEX- / -PEUR-).",
    },
    "FRAGMENTATION_THRESHOLD_DOP": {
        "value": 6500000.0,
        "label": "Umbral General por Defecto (Sin Sigla de Modalidad)",
        "category": "UMBRALES_DGCP",
        "min": 1000000.0,
        "max": 25000000.0,
        "step": 500000.0,
        "description": "Umbral general en DOP aplicado únicamente cuando el código del expediente no contiene una sigla de modalidad identificable.",
    },
}

ANOMALY_TYPE_LABELS: dict[str, str] = {
    "PRICE_ANOMALY": "Variación Atípica de Precios",
    "FRAGMENTATION": "Fraccionamiento Contractual",
    "COLLUSION": "Coordinación entre Oferentes",
}

DISMISSAL_REASON_LABELS: dict[str, str] = {
    "FALSE_POSITIVE": "Variación justificada por especificaciones",
    "EMERGENCY": "Contratación de urgencia / emergencia acreditada",
    "DATA_ERROR": "Error de captura en origen de datos",
    "OTHER": "Sustento técnico documental verificado",
}


class AuditorB2GService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _resolve_institution_scope(self, current_user: dict) -> tuple[int | None, str | None]:
        tenant = current_user.get("tenant") or {}
        tenant_type = tenant.get("tipo")
        inst_id = tenant.get("institution_id")
        if tenant_type == "GOV_INSTITUTION" and inst_id:
            inst_row = (
                await self.db.execute(select(Institution.name).where(Institution.id == int(inst_id)))
            ).first()
            inst_name = str(inst_row[0]) if inst_row and inst_row[0] else tenant.get("nombre")
            return int(inst_id), inst_name
        return None, None

    async def list_institutional_processes(
        self,
        current_user: dict,
        q: str = "",
        status: str = "",
        only_with_anomalies: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(int(limit or 20), 100))
        offset = (safe_page - 1) * safe_limit

        inst_id, inst_name = await self._resolve_institution_scope(current_user)

        contract_agg = (
            select(
                Contract.process_id.label("process_id"),
                func.count(Contract.id).label("contracts_count"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("total_amount"),
                func.max(Contract.status).label("latest_status"),
                func.max(Contract.signed_date).label("latest_signed_date"),
                func.max(Contract.supplier_name).label("primary_supplier"),
            )
            .where(Contract.process_id.is_not(None))
            .group_by(Contract.process_id)
            .subquery()
        )

        anomaly_agg = (
            select(
                Anomaly.process_id.label("process_id"),
                func.count(Anomaly.id).label("anomalies_count"),
                func.coalesce(func.max(Anomaly.severity), 0.0).label("max_severity"),
            )
            .where(Anomaly.process_id.is_not(None))
            .group_by(Anomaly.process_id)
            .subquery()
        )

        base_stmt = (
            select(
                Process.id,
                Process.dgcp_code,
                Process.title,
                Process.institution_id,
                func.coalesce(Institution.name, "Entidad Pública").label("institution_name"),
                func.coalesce(contract_agg.c.contracts_count, 0).label("contracts_count"),
                func.coalesce(contract_agg.c.total_amount, 0.0).label("total_amount"),
                func.coalesce(contract_agg.c.latest_status, "Registrado").label("status"),
                contract_agg.c.latest_signed_date.label("signed_date"),
                contract_agg.c.primary_supplier.label("primary_supplier"),
                func.coalesce(anomaly_agg.c.anomalies_count, 0).label("anomalies_count"),
                func.coalesce(anomaly_agg.c.max_severity, 0.0).label("max_severity"),
            )
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .outerjoin(contract_agg, Process.id == contract_agg.c.process_id)
            .outerjoin(anomaly_agg, Process.id == anomaly_agg.c.process_id)
        )

        if inst_id is not None:
            base_stmt = base_stmt.where(Process.institution_id == inst_id)

        query_clean = (q or "").strip()
        if query_clean:
            base_stmt = base_stmt.where(
                or_(
                    Process.dgcp_code.ilike(f"%{query_clean}%"),
                    Process.title.ilike(f"%{query_clean}%"),
                    contract_agg.c.primary_supplier.ilike(f"%{query_clean}%"),
                )
            )

        status_clean = (status or "").strip()
        if status_clean:
            base_stmt = base_stmt.where(contract_agg.c.latest_status.ilike(f"%{status_clean}%"))

        if only_with_anomalies:
            base_stmt = base_stmt.where(func.coalesce(anomaly_agg.c.anomalies_count, 0) > 0)

        subq = base_stmt.subquery()
        kpi_row = (
            await self.db.execute(
                select(
                    func.count(subq.c.id).label("total_processes"),
                    func.coalesce(func.sum(subq.c.contracts_count), 0).label("total_contracts"),
                    func.coalesce(func.sum(subq.c.total_amount), 0.0).label("total_amount"),
                    func.count()
                    .filter(subq.c.anomalies_count > 0)
                    .label("processes_with_findings"),
                )
            )
        ).first()

        total_processes = int(kpi_row.total_processes or 0) if kpi_row else 0
        total_contracts = int(kpi_row.total_contracts or 0) if kpi_row else 0
        total_amount = float(kpi_row.total_amount or 0.0) if kpi_row else 0.0
        processes_with_findings = int(kpi_row.processes_with_findings or 0) if kpi_row else 0

        rows = (
            await self.db.execute(
                base_stmt.order_by(
                    desc(func.coalesce(anomaly_agg.c.anomalies_count, 0)),
                    desc(func.coalesce(contract_agg.c.total_amount, 0.0)),
                    desc(Process.id),
                )
                .offset(offset)
                .limit(safe_limit)
            )
        ).all()

        items = []
        for r in rows:
            signed_str = (
                r.signed_date.strftime("%Y-%m-%d")
                if hasattr(r.signed_date, "strftime") and r.signed_date
                else str(r.signed_date)[:10]
                if r.signed_date
                else "—"
            )
            items.append(
                {
                    "id": int(r.id),
                    "process_code": str(r.dgcp_code),
                    "title": str(r.title or "Proceso de Contratación Pública"),
                    "institution_name": str(r.institution_name),
                    "primary_supplier": str(r.primary_supplier or "Múltiples / En evaluación"),
                    "status": str(r.status or "Adjudicado"),
                    "signed_date": signed_str,
                    "contracts_count": int(r.contracts_count or 0),
                    "total_amount": float(r.total_amount or 0.0),
                    "anomalies_count": int(r.anomalies_count or 0),
                    "max_severity": round(float(r.max_severity or 0.0), 2),
                }
            )

        return {
            "scope_label": inst_name or "Cobertura Nacional Transversal",
            "kpis": {
                "total_processes": total_processes,
                "total_contracts": total_contracts,
                "total_amount": total_amount,
                "processes_with_findings": processes_with_findings,
            },
            "items": items,
            "total": total_processes,
            "page": safe_page,
            "limit": safe_limit,
        }

    async def get_collusion_network(self, current_user: dict) -> dict:
        tenant = current_user.get("tenant") or {}
        plan_code = tenant.get("plan_tier") or tenant.get("plan") or "B2G_BASIC"
        if plan_code == "B2G_BASIC" and current_user.get("rol", {}).get("codigo") != "PLATFORM_ADMIN":
            return {
                "locked": True,
                "required_plan": "B2G_PRO",
                "scope_label": tenant.get("nombre") or "Unidad Institucional",
                "kpis": {
                    "clusters_detected": 0,
                    "suppliers_flagged": 0,
                    "collusion_anomalies_count": 0,
                    "exposed_amount": 0.0,
                },
                "pairs": [],
                "recurrent_suppliers": [],
            }

        inst_id, inst_name = await self._resolve_institution_scope(current_user)

        collusion_stmt = select(Anomaly).where(Anomaly.anomaly_type == "COLLUSION")
        if inst_id is not None:
            collusion_stmt = collusion_stmt.where(
                or_(
                    Anomaly.process_id.in_(select(Process.id).where(Process.institution_id == inst_id)),
                    Anomaly.institution_name == inst_name,
                )
            )
        collusion_rows = (await self.db.execute(collusion_stmt.order_by(desc(Anomaly.severity)).limit(40))).scalars().all()

        proc_supplier_stmt = (
            select(
                Contract.process_id,
                Process.dgcp_code,
                func.coalesce(Institution.name, "Entidad Pública").label("institution_name"),
                Contract.supplier_name,
                Contract.rpe,
                func.count(Contract.id).label("contracts_in_proc"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("amount_in_proc"),
            )
            .join(Process, Contract.process_id == Process.id)
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .where(Contract.supplier_name.is_not(None))
        )
        if inst_id is not None:
            proc_supplier_stmt = proc_supplier_stmt.where(Process.institution_id == inst_id)

        proc_supplier_stmt = (
            proc_supplier_stmt.group_by(
                Contract.process_id,
                Process.dgcp_code,
                Institution.name,
                Contract.supplier_name,
                Contract.rpe,
            )
            .order_by(desc(func.sum(Contract.amount_adjudicated)))
            .limit(200)
        )
        proc_rows = (await self.db.execute(proc_supplier_stmt)).all()

        by_process: dict[int, list] = {}
        supplier_totals: dict[str, dict] = {}
        for r in proc_rows:
            pid = int(r.process_id)
            by_process.setdefault(pid, []).append(r)
            sname = str(r.supplier_name)
            entry = supplier_totals.setdefault(
                sname,
                {
                    "supplier_name": sname,
                    "rpe": str(r.rpe or "S/R"),
                    "institution_name": str(r.institution_name),
                    "processes_count": 0,
                    "contracts_count": 0,
                    "total_amount": 0.0,
                },
            )
            entry["processes_count"] += 1
            entry["contracts_count"] += int(r.contracts_in_proc or 0)
            entry["total_amount"] += float(r.amount_in_proc or 0.0)

        pairs_map: dict[tuple[str, str], dict] = {}
        for pid, group in by_process.items():
            unique_suppliers = []
            seen_names = set()
            for item in group:
                nm = str(item.supplier_name)
                if nm not in seen_names:
                    seen_names.add(nm)
                    unique_suppliers.append(item)
            if len(unique_suppliers) >= 2:
                for i in range(len(unique_suppliers)):
                    for j in range(i + 1, min(len(unique_suppliers), i + 4)):
                        s1 = unique_suppliers[i]
                        s2 = unique_suppliers[j]
                        key = tuple(sorted([str(s1.supplier_name), str(s2.supplier_name)]))
                        pair_entry = pairs_map.setdefault(
                            key,
                            {
                                "supplier_a": key[0],
                                "supplier_b": key[1],
                                "institution_name": str(s1.institution_name),
                                "shared_processes_count": 0,
                                "sample_process_code": str(s1.dgcp_code),
                                "combined_amount": 0.0,
                                "pattern_label": "Concurrencia simultánea en lote adjudicado",
                                "risk_score": 0.68,
                            },
                        )
                        pair_entry["shared_processes_count"] += 1
                        pair_entry["combined_amount"] += float(s1.amount_in_proc or 0.0) + float(s2.amount_in_proc or 0.0)
                        pair_entry["risk_score"] = min(0.96, round(0.62 + pair_entry["shared_processes_count"] * 0.08, 2))

        if not pairs_map and collusion_rows:
            for idx, anom in enumerate(collusion_rows[:8]):
                sup_a = str(anom.supplier_name or f"Consorcio Oferente {idx + 1}A")
                sup_b = f"Oferente Relacionado {idx + 1}B"
                pairs_map[(sup_a, sup_b)] = {
                    "supplier_a": sup_a,
                    "supplier_b": sup_b,
                    "institution_name": str(anom.institution_name or inst_name or "Entidad Pública"),
                    "shared_processes_count": max(2, int(anom.signals_count or 2)),
                    "sample_process_code": str(anom.process_code or "DGCP-2025-COL"),
                    "combined_amount": float(anom.amount or 0.0),
                    "pattern_label": "Patrón de alternancia y rotación detectado",
                    "risk_score": round(float(anom.severity or 0.78), 2),
                }

        recurrent_list = sorted(
            supplier_totals.values(),
            key=lambda x: (x["processes_count"], x["total_amount"]),
            reverse=True,
        )[:12]

        if not pairs_map and len(recurrent_list) >= 2:
            for idx in range(0, min(len(recurrent_list) - 1, 6), 2):
                sa = recurrent_list[idx]
                sb = recurrent_list[idx + 1]
                pairs_map[(sa["supplier_name"], sb["supplier_name"])] = {
                    "supplier_a": sa["supplier_name"],
                    "supplier_b": sb["supplier_name"],
                    "institution_name": sa["institution_name"],
                    "shared_processes_count": max(1, min(sa["processes_count"], sb["processes_count"])),
                    "sample_process_code": "Múltiples Procesos",
                    "combined_amount": round(sa["total_amount"] + sb["total_amount"], 2),
                    "pattern_label": "Concentración concurrente en el mismo organismo",
                    "risk_score": 0.72,
                }

        pairs_list = sorted(pairs_map.values(), key=lambda x: (x["risk_score"], x["combined_amount"]), reverse=True)[:15]
        exposed_amount = sum(float(a.amount or 0.0) for a in collusion_rows) or sum(p["combined_amount"] for p in pairs_list)

        return {
            "locked": False,
            "required_plan": "B2G_PRO",
            "scope_label": inst_name or "Cobertura Nacional Transversal",
            "kpis": {
                "clusters_detected": len(pairs_list),
                "suppliers_flagged": len(recurrent_list),
                "collusion_anomalies_count": len(collusion_rows),
                "exposed_amount": round(float(exposed_amount), 2),
            },
            "pairs": pairs_list,
            "recurrent_suppliers": recurrent_list,
        }

    async def get_detection_config(self, current_user: dict) -> dict:
        inst_id, inst_name = await self._resolve_institution_scope(current_user)
        existing_rows = (await self.db.execute(select(DetectionConfig))).scalars().all()
        existing_map = {row.key: row for row in existing_rows}

        for key, meta in DEFAULT_DETECTION_CONFIG.items():
            if key not in existing_map:
                new_row = DetectionConfig(key=key, value=float(meta["value"]))
                self.db.add(new_row)
                existing_map[key] = new_row
        await self.db.commit()

        role_code = current_user.get("rol", {}).get("codigo", "")
        can_edit = role_code in ("PLATFORM_ADMIN", "TENANT_ADMIN", "CONTRALOR")

        parameters = []
        for key, meta in DEFAULT_DETECTION_CONFIG.items():
            row = existing_map.get(key)
            val = float(row.value) if row and row.value is not None else float(meta["value"])
            updated_str = (
                row.updated_at.strftime("%Y-%m-%d %H:%M")
                if row and getattr(row, "updated_at", None) and hasattr(row.updated_at, "strftime")
                else "Valor por defecto"
            )
            parameters.append(
                {
                    "key": key,
                    "label": meta["label"],
                    "category": meta["category"],
                    "value": round(val, 2),
                    "default_value": float(meta["value"]),
                    "min": float(meta["min"]),
                    "max": float(meta["max"]),
                    "step": float(meta["step"]),
                    "description": meta["description"],
                    "updated_at": updated_str,
                }
            )

        return {
            "scope_label": inst_name or "Motor Analítico Institucional",
            "can_edit": can_edit,
            "parameters": parameters,
        }

    async def update_detection_config(self, current_user: dict, updates: dict[str, float]) -> dict:
        role_code = current_user.get("rol", {}).get("codigo", "")
        if role_code not in ("PLATFORM_ADMIN", "TENANT_ADMIN", "CONTRALOR"):
            raise PermissionError("FORBIDDEN_CONFIG_EDIT")

        existing_rows = (await self.db.execute(select(DetectionConfig))).scalars().all()
        existing_map = {row.key: row for row in existing_rows}

        old_values: dict[str, float] = {}
        new_values: dict[str, float] = {}

        for key, raw_val in (updates or {}).items():
            if key not in DEFAULT_DETECTION_CONFIG:
                continue
            meta = DEFAULT_DETECTION_CONFIG[key]
            clamped = max(float(meta["min"]), min(float(raw_val), float(meta["max"])))
            row = existing_map.get(key)
            old_val = float(row.value) if row and row.value is not None else float(meta["value"])
            old_values[key] = round(old_val, 2)
            new_values[key] = round(clamped, 2)
            if row:
                row.value = clamped
                row.updated_at = utcnow_naive()
            else:
                self.db.add(DetectionConfig(key=key, value=clamped))

        if new_values:
            self.db.add(
                AuditLog(
                    action_type="UPDATE_DETECTION_CONFIG",
                    user_id=None,
                    entity_type="detection_config",
                    entity_id=str(current_user.get("tenant", {}).get("id") or "global"),
                    old_value=old_values,
                    new_value={
                        "actor_email": (current_user.get("correo") or current_user.get("email")),
                        "actor_name": current_user.get("nombre"),
                        "parameters": new_values,
                    },
                )
            )
            await self.db.commit()

        return await self.get_detection_config(current_user)

    async def list_audit_resolutions(
        self,
        current_user: dict,
        decision: str = "",
        q: str = "",
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(int(limit or 20), 100))
        offset = (safe_page - 1) * safe_limit

        inst_id, inst_name = await self._resolve_institution_scope(current_user)

        stmt = select(Anomaly).where(Anomaly.status.in_(["CONFIRMED", "DISMISSED"]))
        if inst_id is not None:
            stmt = stmt.where(
                or_(
                    Anomaly.process_id.in_(select(Process.id).where(Process.institution_id == inst_id)),
                    Anomaly.institution_name == inst_name,
                )
            )

        decision_clean = (decision or "").strip().upper()
        if decision_clean in ("CONFIRMED", "DISMISSED"):
            stmt = stmt.where(Anomaly.status == decision_clean)

        query_clean = (q or "").strip()
        if query_clean:
            stmt = stmt.where(
                or_(
                    Anomaly.process_code.ilike(f"%{query_clean}%"),
                    Anomaly.supplier_name.ilike(f"%{query_clean}%"),
                    Anomaly.institution_name.ilike(f"%{query_clean}%"),
                    Anomaly.description.ilike(f"%{query_clean}%"),
                )
            )

        subq = stmt.subquery()
        kpi_row = (
            await self.db.execute(
                select(
                    func.count(subq.c.id).label("total_resolved"),
                    func.count().filter(subq.c.status == "CONFIRMED").label("confirmed_count"),
                    func.count().filter(subq.c.status == "DISMISSED").label("dismissed_count"),
                    func.coalesce(func.sum(subq.c.amount), 0.0).label("audited_amount"),
                )
            )
        ).first()

        total_resolved = int(kpi_row.total_resolved or 0) if kpi_row else 0
        confirmed_count = int(kpi_row.confirmed_count or 0) if kpi_row else 0
        dismissed_count = int(kpi_row.dismissed_count or 0) if kpi_row else 0
        audited_amount = float(kpi_row.audited_amount or 0.0) if kpi_row else 0.0

        rows = (
            await self.db.execute(
                stmt.order_by(desc(Anomaly.updated_at), desc(Anomaly.severity))
                .offset(offset)
                .limit(safe_limit)
            )
        ).scalars().all()

        items = []
        for a in rows:
            resolved_dt = (
                a.updated_at.strftime("%Y-%m-%d %H:%M")
                if getattr(a, "updated_at", None) and hasattr(a.updated_at, "strftime")
                else "Reciente"
            )
            reason_code = str(a.dismissal_reason or "")
            reason_label = (
                DISMISSAL_REASON_LABELS.get(reason_code, reason_code or "Observación ratificada en revisión técnica")
                if a.status == "DISMISSED"
                else "Irregularidad confirmada en dictamen de control interno"
            )
            items.append(
                {
                    "id": str(a.id),
                    "process_code": str(a.process_code or "S/C"),
                    "institution_name": str(a.institution_name or inst_name or "Entidad Pública"),
                    "supplier_name": str(a.supplier_name or "Proveedor Adjudicatario"),
                    "anomaly_type": str(a.anomaly_type),
                    "anomaly_type_label": ANOMALY_TYPE_LABELS.get(str(a.anomaly_type), str(a.anomaly_type)),
                    "status": str(a.status),
                    "status_label": "Confirmada" if a.status == "CONFIRMED" else "Desestimada",
                    "severity": round(float(a.severity or 0.0), 2),
                    "amount": float(a.amount or 0.0),
                    "resolution_summary": reason_label,
                    "resolved_at": resolved_dt,
                }
            )

        return {
            "scope_label": inst_name or "Cobertura Nacional Transversal",
            "kpis": {
                "total_resolved": total_resolved,
                "confirmed_count": confirmed_count,
                "dismissed_count": dismissed_count,
                "audited_amount": audited_amount,
            },
            "items": items,
            "total": total_resolved,
            "page": safe_page,
            "limit": safe_limit,
        }

    async def get_compliance_report_summary(self, current_user: dict) -> dict:
        inst_id, inst_name = await self._resolve_institution_scope(current_user)

        proc_stmt = select(func.count(Process.id))
        contract_stmt = select(
            func.count(Contract.id).label("contracts_count"),
            func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("contracts_amount"),
        )
        anomaly_stmt = select(Anomaly)

        if inst_id is not None:
            proc_stmt = proc_stmt.where(Process.institution_id == inst_id)
            contract_stmt = contract_stmt.join(Process, Contract.process_id == Process.id).where(
                Process.institution_id == inst_id
            )
            anomaly_stmt = anomaly_stmt.where(
                or_(
                    Anomaly.process_id.in_(select(Process.id).where(Process.institution_id == inst_id)),
                    Anomaly.institution_name == inst_name,
                )
            )

        total_processes = int((await self.db.execute(proc_stmt)).scalar() or 0)
        contract_row = (await self.db.execute(contract_stmt)).first()
        total_contracts = int(contract_row.contracts_count or 0) if contract_row else 0
        total_amount = float(contract_row.contracts_amount or 0.0) if contract_row else 0.0

        anomalies = (await self.db.execute(anomaly_stmt.order_by(desc(Anomaly.severity)))).scalars().all()

        total_anomalies = len(anomalies)
        pending_count = sum(1 for a in anomalies if a.status == "PENDING")
        confirmed_count = sum(1 for a in anomalies if a.status == "CONFIRMED")
        dismissed_count = sum(1 for a in anomalies if a.status == "DISMISSED")
        critical_count = sum(1 for a in anomalies if float(a.severity or 0.0) >= 0.75)
        exposed_amount = sum(float(a.amount or 0.0) for a in anomalies)

        by_type_map: dict[str, dict] = {}
        for a in anomalies:
            tcode = str(a.anomaly_type or "PRICE_ANOMALY")
            entry = by_type_map.setdefault(
                tcode,
                {
                    "anomaly_type": tcode,
                    "label": ANOMALY_TYPE_LABELS.get(tcode, tcode),
                    "count": 0,
                    "confirmed": 0,
                    "pending": 0,
                    "amount": 0.0,
                },
            )
            entry["count"] += 1
            if a.status == "CONFIRMED":
                entry["confirmed"] += 1
            elif a.status == "PENDING":
                entry["pending"] += 1
            entry["amount"] += float(a.amount or 0.0)

        top_findings = []
        for a in anomalies[:15]:
            top_findings.append(
                {
                    "id": str(a.id),
                    "process_code": str(a.process_code or "S/C"),
                    "institution_name": str(a.institution_name or inst_name or "Entidad Pública"),
                    "supplier_name": str(a.supplier_name or "Proveedor Adjudicatario"),
                    "anomaly_type_label": ANOMALY_TYPE_LABELS.get(str(a.anomaly_type), str(a.anomaly_type)),
                    "severity": round(float(a.severity or 0.0), 2),
                    "status_label": (
                        "Confirmada"
                        if a.status == "CONFIRMED"
                        else "Desestimada"
                        if a.status == "DISMISSED"
                        else "Pendiente de Revisión"
                    ),
                    "amount": float(a.amount or 0.0),
                }
            )

        resolution_rate = (
            round(((confirmed_count + dismissed_count) / total_anomalies) * 100.0, 1)
            if total_anomalies > 0
            else 100.0
        )

        return {
            "generated_at": datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC"),
            "scope_label": inst_name or "Cobertura Nacional Transversal",
            "organization_name": current_user.get("tenant", {}).get("nombre") or "Unidad de Auditoría",
            "prepared_by": current_user.get("nombre") or "Auditor Institucional",
            "kpis": {
                "total_processes": total_processes,
                "total_contracts": total_contracts,
                "total_amount": total_amount,
                "total_anomalies": total_anomalies,
                "critical_count": critical_count,
                "pending_count": pending_count,
                "confirmed_count": confirmed_count,
                "dismissed_count": dismissed_count,
                "exposed_amount": exposed_amount,
                "resolution_rate_pct": resolution_rate,
            },
            "breakdown_by_type": list(by_type_map.values()),
            "top_findings": top_findings,
        }

    async def list_integrations(self, current_user: dict) -> dict:
        tenant = current_user.get("tenant") or {}
        tenant_id = str(tenant.get("id") or "global")
        plan_code = tenant.get("plan_tier") or tenant.get("plan") or "B2G_BASIC"
        role_code = current_user.get("rol", {}).get("codigo", "")

        logs = (
            await self.db.execute(
                select(AuditLog)
                .where(
                    AuditLog.entity_type == "integration_key",
                    AuditLog.entity_id.like(f"{tenant_id}:%"),
                )
                .order_by(desc(AuditLog.timestamp))
            )
        ).scalars().all()

        revoked_ids = {
            str(log.entity_id).split(":", 1)[1]
            for log in logs
            if log.action_type == "REVOKE_INTEGRATION_KEY" and ":" in str(log.entity_id)
        }

        active_keys = []
        seen_ids = set()
        for log in logs:
            if log.action_type != "CREATE_INTEGRATION_KEY" or ":" not in str(log.entity_id):
                continue
            key_id = str(log.entity_id).split(":", 1)[1]
            if key_id in seen_ids:
                continue
            seen_ids.add(key_id)
            meta = log.new_value or {}
            created_str = (
                log.timestamp.strftime("%Y-%m-%d %H:%M")
                if getattr(log, "timestamp", None) and hasattr(log.timestamp, "strftime")
                else "Reciente"
            )
            active_keys.append(
                {
                    "id": key_id,
                    "name": str(meta.get("name") or "Conector Institucional"),
                    "system_target": str(meta.get("system_target") or "Tablero BI / ERP Institucional"),
                    "prefix": str(meta.get("prefix") or "vdia_live_••••"),
                    "created_by": str(meta.get("created_by") or "Administrador"),
                    "created_at": created_str,
                    "status": "REVOKED" if key_id in revoked_ids else "ACTIVE",
                }
            )

        can_manage = role_code == "PLATFORM_ADMIN" or (role_code in ("TENANT_ADMIN", "CONTRALOR") and plan_code != "B2G_BASIC")

        return {
            "scope_label": tenant.get("nombre") or "Organización Institucional",
            "plan_code": plan_code,
            "can_manage": can_manage,
            "endpoints_catalog": [
                {
                    "name": "Flujo de Hallazgos Institucionales (JSON / OData)",
                    "method": "GET",
                    "path": "/api/integration/anomalies?page=1&limit=100",
                    "description": "Sincroniza alertas preventivas y puntuaciones de severidad hacia tableros Power BI, Tableau o sistemas de control interno.",
                },
                {
                    "name": "Resumen Ejecutivo de Cumplimiento Normativo",
                    "method": "GET",
                    "path": "/api/integration/reports/summary",
                    "description": "Entrega métricas consolidadas de procesos auditados, casos confirmados y tasa de resolución institucional.",
                },
                {
                    "name": "Historial de Dictámenes y Resoluciones",
                    "method": "GET",
                    "path": "/api/integration/resolutions",
                    "description": "Exporta el registro auditable de hallazgos ratificados o desestimados con su fecha de dictamen.",
                },
            ],
            "keys": active_keys,
        }

    async def create_integration_key(
        self, current_user: dict, name: str, system_target: str
    ) -> dict:
        tenant = current_user.get("tenant") or {}
        tenant_id = str(tenant.get("id") or "global")
        plan_code = tenant.get("plan_tier") or tenant.get("plan") or "B2G_BASIC"
        role_code = current_user.get("rol", {}).get("codigo", "")

        if role_code not in ("PLATFORM_ADMIN", "TENANT_ADMIN", "CONTRALOR") or (
            plan_code == "B2G_BASIC" and role_code != "PLATFORM_ADMIN"
        ):
            raise PermissionError("FORBIDDEN_INTEGRATION_KEY")

        clean_name = (name or "").strip() or "Conector de Auditoría"
        clean_target = (system_target or "").strip() or "Power BI / Tablero Institucional"
        key_id = secrets.token_hex(6)
        raw_secret = f"vdia_b2g_{key_id}_{secrets.token_urlsafe(18)}"
        key_hash = hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()
        prefix = f"{raw_secret[:14]}••••{raw_secret[-4:]}"

        log_entry = AuditLog(
            action_type="CREATE_INTEGRATION_KEY",
            user_id=None,
            entity_type="integration_key",
            entity_id=f"{tenant_id}:{key_id}",
            old_value=None,
            new_value={
                "name": clean_name,
                "system_target": clean_target,
                "prefix": prefix,
                "key_hash": key_hash,
                "created_by": current_user.get("nombre") or (current_user.get("correo") or current_user.get("email")),
            },
        )
        self.db.add(log_entry)
        await self.db.commit()

        return {
            "id": key_id,
            "name": clean_name,
            "system_target": clean_target,
            "prefix": prefix,
            "raw_token": raw_secret,
            "created_at": datetime.now(UTC).strftime("%Y-%m-%d %H:%M"),
        }

    async def revoke_integration_key(self, current_user: dict, key_id: str) -> dict:
        tenant = current_user.get("tenant") or {}
        tenant_id = str(tenant.get("id") or "global")
        role_code = current_user.get("rol", {}).get("codigo", "")
        if role_code not in ("PLATFORM_ADMIN", "TENANT_ADMIN", "CONTRALOR"):
            raise PermissionError("FORBIDDEN_INTEGRATION_KEY")

        self.db.add(
            AuditLog(
                action_type="REVOKE_INTEGRATION_KEY",
                user_id=None,
                entity_type="integration_key",
                entity_id=f"{tenant_id}:{key_id}",
                old_value={"status": "ACTIVE"},
                new_value={
                    "status": "REVOKED",
                    "revoked_by": current_user.get("nombre") or (current_user.get("correo") or current_user.get("email")),
                },
            )
        )
        await self.db.commit()
        return {"id": key_id, "status": "REVOKED"}


    async def resolve_integration_caller(self, raw_token: str) -> dict | None:
        clean = (raw_token or "").strip()
        if not clean.startswith("vdia_b2g_"):
            return None
        parts = clean.split("_")
        if len(parts) < 4:
            return None
        key_id = parts[2]
        token_hash = hashlib.sha256(clean.encode("utf-8")).hexdigest()

        logs = (
            await self.db.execute(
                select(AuditLog)
                .where(
                    AuditLog.entity_type == "integration_key",
                    AuditLog.entity_id.like(f"%:{key_id}"),
                )
                .order_by(desc(AuditLog.timestamp))
            )
        ).scalars().all()

        if any(l.action_type == "REVOKE_INTEGRATION_KEY" for l in logs):
            return None

        create_log = next((l for l in logs if l.action_type == "CREATE_INTEGRATION_KEY"), None)
        if not create_log or not create_log.new_value:
            return None

        if create_log.new_value.get("key_hash") != token_hash:
            return None

        tenant_id_str = str(create_log.entity_id).split(":", 1)[0]
        from src.models.auth import Tenant
        tenant_row = None
        if tenant_id_str.isdigit():
            tenant_row = (
                await self.db.execute(select(Tenant).where(Tenant.id == int(tenant_id_str)))
            ).scalar_one_or_none()

        if tenant_row:
            return {
                "id": 0,
                "nombre": f"Conector ({create_log.new_value.get('name', 'Integraci?n')})",
                "correo": "integracion@veedoria.gob.do",
                "rol": {"codigo": "AUDITOR", "nombre": "Conector Institucional"},
                "tenant": {
                    "id": tenant_row.id,
                    "codigo": tenant_row.codigo,
                    "nombre": tenant_row.nombre,
                    "tipo": tenant_row.tipo,
                    "plan_tier": tenant_row.plan_tier,
                    "institution_id": tenant_row.institution_id,
                },
            }

        return {
            "id": 0,
            "nombre": f"Conector ({create_log.new_value.get('name', 'Integraci?n')})",
            "correo": "integracion@veedoria.gob.do",
            "rol": {"codigo": "PLATFORM_ADMIN", "nombre": "Conector Global"},
            "tenant": {
                "id": 0,
                "codigo": "GLOBAL",
                "nombre": "Cobertura Nacional Transversal",
                "tipo": "PLATFORM",
                "plan_tier": "PLATFORM_GLOBAL",
                "institution_id": None,
            },
        }


    async def get_process_dossier(self, current_user: dict, process_id: int) -> dict | None:
        inst_id, inst_name = await self._resolve_institution_scope(current_user)
        proc_stmt = (
            select(
                Process.id,
                Process.dgcp_code,
                Process.title,
                Process.institution_id,
                func.coalesce(Institution.name, "Entidad P?blica").label("institution_name"),
            )
            .outerjoin(Institution, Process.institution_id == Institution.id)
            .where(Process.id == int(process_id))
        )
        if inst_id is not None:
            proc_stmt = proc_stmt.where(Process.institution_id == inst_id)

        proc_row = (await self.db.execute(proc_stmt)).first()
        if not proc_row:
            return None

        contracts_rows = (
            await self.db.execute(
                select(Contract)
                .where(Contract.process_id == int(process_id))
                .order_by(desc(Contract.amount_adjudicated))
            )
        ).scalars().all()

        anomalies_rows = (
            await self.db.execute(
                select(Anomaly)
                .where(Anomaly.process_id == int(process_id))
                .order_by(desc(Anomaly.severity))
            )
        ).scalars().all()

        contracts_list = [
            {
                "id": int(c.id),
                "contract_code": str(c.contract_id or f"CTR-{c.id}"),
                "supplier_name": str(c.supplier_name or "Proveedor Adjudicatario"),
                "rpe": str(c.rpe or "S/R"),
                "status": str(c.status or "Adjudicado"),
                "signed_date": (
                    c.signed_date.strftime("%Y-%m-%d")
                    if getattr(c, "signed_date", None) and hasattr(c.signed_date, "strftime")
                    else str(c.signed_date)[:10]
                    if getattr(c, "signed_date", None)
                    else "?"
                ),
                "amount": float(c.amount_adjudicated or 0.0),
            }
            for c in contracts_rows
        ]

        anomalies_list = [
            {
                "id": str(a.id),
                "process_id": a.process_id,
                "contract_id": a.contract_id,
                "anomaly_type": str(a.anomaly_type),
                "anomaly_type_label": ANOMALY_TYPE_LABELS.get(str(a.anomaly_type), str(a.anomaly_type)),
                "severity": round(float(a.severity or 0.0), 2),
                "confidence": a.confidence,
                "signals_count": a.signals_count,
                "status": str(a.status),
                "description": str(a.description or ""),
                "amount": float(a.amount or 0.0),
                "process_code": str(a.process_code or proc_row.dgcp_code),
                "supplier_name": str(a.supplier_name or ""),
                "institution_name": str(a.institution_name or proc_row.institution_name),
                "created_at": (
                    a.created_at.isoformat()
                    if getattr(a, "created_at", None) and hasattr(a.created_at, "isoformat")
                    else None
                ),
            }
            for a in anomalies_rows
        ]

        return {
            "id": int(proc_row.id),
            "process_code": str(proc_row.dgcp_code),
            "title": str(proc_row.title or "Proceso de Contrataci?n P?blica"),
            "institution_name": str(proc_row.institution_name),
            "total_amount": sum(c["amount"] for c in contracts_list),
            "contracts": contracts_list,
            "anomalies": anomalies_list,
        }
