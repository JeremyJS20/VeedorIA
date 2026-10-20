from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.auth import AppUser, Tenant
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.sync_log import SyncLog
from src.services.auth_service import PLAN_CLEAN_LABELS

UNSPSC_FAMILY_LABELS: dict[str, str] = {
    "8210": "Servicios de Publicidad, Comunicación Institucional y Medios",
    "9010": "Servicios de Alimentación, Catering y Eventos Oficiales",
    "7210": "Servicios de Mantenimiento y Reparación de Edificaciones",
    "7212": "Construcción de Edificaciones Públicas y No Residenciales",
    "7214": "Servicios de Construcción Pesada, Carreteras y Obras Viales",
    "7215": "Servicios Especializados de Construcción y Acondicionamiento",
    "4321": "Equipos Informáticos, Computadoras y Servidores",
    "4323": "Licencias de Software y Plataformas Tecnológicas",
    "4412": "Suministros, Papelería y Material de Oficina",
    "1510": "Combustibles, Lubricantes y Derivados Energéticos",
    "2510": "Vehículos de Transporte Oficial y Flotillas",
    "3011": "Cemento, Hormigón, Asfalto y Materiales de Obra Gris",
    "4214": "Suministros Clínicos y Quirúrgicos Desechables",
    "4218": "Equipos y Suministros de Examen y Monitoreo Médico",
    "4229": "Instrumentos y Productos Quirúrgicos Especializados",
    "4713": "Suministros de Limpieza, Higiene y Saneamiento Institucional",
    "5019": "Alimentos Preparados, Raciones y Provisiones Institucionales",
    "5020": "Bebidas, Lácteos y Suministros Alimenticios Escolares",
    "5110": "Medicamentos Antiinfecciosos y Tratamientos Clínicos",
    "5310": "Indumentaria Institucional, Uniformes y Calzado de Trabajo",
    "5610": "Mobiliario de Oficina y Equipamiento Escolar",
    "7811": "Servicios de Transporte de Pasajeros y Logística Institucional",
    "8011": "Servicios Profesionales y Consultoría Institucional",
    "8014": "Servicios de Comercialización, Distribución y Logística",
    "8111": "Servicios de Ingeniería Informática y Soporte Tecnológico",
}


def _format_compact_dop(amount: float) -> str:
    val = float(amount or 0.0)
    if val >= 1_000_000_000:
        return f"RD$ {val / 1_000_000_000:,.2f}B"
    if val >= 1_000_000:
        return f"RD$ {val / 1_000_000:,.1f}M"
    if val >= 1_000:
        return f"RD$ {val / 1_000:,.1f}K"
    return f"RD$ {val:,.0f}"


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self, current_user: dict, view_mode: str | None = None) -> dict:
        tenant = current_user.get("tenant") or {}
        role_code = (current_user.get("rol") or {}).get("codigo", "")
        tenant_type = tenant.get("tipo", "GOV_INSTITUTION")

        requested_mode = (view_mode or "").strip().upper()
        if role_code == "PLATFORM_ADMIN" and requested_mode in ("ADMIN", "B2G", "B2B"):
            variant = requested_mode
        elif tenant_type == "PLATFORM":
            variant = "ADMIN"
        elif tenant_type == "B2B_SUPPLIER":
            variant = "B2B"
        else:
            variant = "B2G"

        if variant == "ADMIN":
            return await self._get_admin_overview(current_user)
        if variant == "B2B":
            return await self._get_b2b_overview(current_user)
        return await self._get_b2g_overview(current_user)

    async def _get_b2g_overview(self, current_user: dict) -> dict:
        tenant = current_user.get("tenant") or {}
        plan_tier = tenant.get("plan_tier", "B2G_PREMIUM")
        if plan_tier not in ("B2G_BASIC", "B2G_PREMIUM", "B2G_ENTERPRISE", "PLATFORM_GLOBAL"):
            plan_tier = "B2G_PREMIUM"
        plan_label = PLAN_CLEAN_LABELS.get(plan_tier, "Plan Institucional Avanzado")
        is_basic = plan_tier == "B2G_BASIC"

        inst_id = tenant.get("institution_id")
        scope_label = tenant.get("nombre") or "Alcance Nacional"
        if tenant.get("tipo") in ("PLATFORM", "GOV_OVERSIGHT"):
            scope_label = "Alcance Nacional (Todas las Unidades de Compra)"
            inst_id = None

        proc_stmt = select(func.count(Process.id))
        if inst_id:
            proc_stmt = proc_stmt.where(Process.institution_id == int(inst_id))
        total_processes = int((await self.db.execute(proc_stmt)).scalar() or 0)

        contract_stmt = select(func.coalesce(func.sum(Contract.amount_adjudicated), 0.0)).join(
            Process, Contract.process_id == Process.id
        )
        if inst_id:
            contract_stmt = contract_stmt.where(Process.institution_id == int(inst_id))
        total_amount_dop = float((await self.db.execute(contract_stmt)).scalar() or 0.0)

        frag_stmt = select(func.count(Anomaly.id)).join(
            Process, Anomaly.process_id == Process.id, isouter=True
        ).where(Anomaly.anomaly_type == "FRAGMENTATION")
        if inst_id:
            frag_stmt = frag_stmt.where(Process.institution_id == int(inst_id))
        frag_count = int((await self.db.execute(frag_stmt)).scalar() or 0)

        price_stmt = select(func.count(Anomaly.id)).join(
            Process, Anomaly.process_id == Process.id, isouter=True
        ).where(Anomaly.anomaly_type == "PRICE_ANOMALY")
        if inst_id:
            price_stmt = price_stmt.where(Process.institution_id == int(inst_id))
        price_count = int((await self.db.execute(price_stmt)).scalar() or 0)

        total_anom_stmt = select(func.count(Anomaly.id)).join(
            Process, Anomaly.process_id == Process.id, isouter=True
        )
        if inst_id:
            total_anom_stmt = total_anom_stmt.where(Process.institution_id == int(inst_id))
        total_anomalies = int((await self.db.execute(total_anom_stmt)).scalar() or 0)

        denom = max(total_processes, 1)
        integrity_pct = max(62.0, min(99.4, round(100.0 - (min(total_anomalies, denom) / denom * 28.0), 1)))

        anom_rows_stmt = (
            select(Anomaly, Process.title)
            .join(Process, Anomaly.process_id == Process.id, isouter=True)
            .order_by(desc(Anomaly.severity), desc(Anomaly.created_at))
            .limit(8)
        )
        if inst_id:
            anom_rows_stmt = anom_rows_stmt.where(Process.institution_id == int(inst_id))
        raw_rows = (await self.db.execute(anom_rows_stmt)).all()

        rows: list[dict] = []
        type_labels = {
            "PRICE_ANOMALY": "Sobreprecio Unitario",
            "FRAGMENTATION": "Fraccionamiento Contractual",
            "COLLUSION": "Asociación entre Oferentes",
        }
        for anom, proc_title in raw_rows:
            sev = float(anom.severity or 0.5)
            if sev >= 0.75:
                status_badge = "Riesgo Crítico"
                status_tone = "critical"
            elif sev >= 0.45:
                status_badge = "Advertencia Preventiva"
                status_tone = "warning"
            else:
                status_badge = "Observación Moderada"
                status_tone = "low"

            row_locked = bool(is_basic and anom.anomaly_type == "PRICE_ANOMALY")
            rows.append(
                {
                    "id": str(anom.id),
                    "process_code": anom.process_code or f"PROC-{anom.process_id or 100}",
                    "title": proc_title or anom.description[:95],
                    "secondary_label": anom.supplier_name or anom.institution_name or scope_label,
                    "amount_dop": float(anom.amount or 0.0),
                    "status_badge": status_badge,
                    "status_tone": status_tone,
                    "detail_badge": type_labels.get(anom.anomaly_type, "Hallazgo Preventivo"),
                    "date_label": anom.created_at.strftime("%Y-%m-%d") if anom.created_at else "2025-11-15",
                    "locked": row_locked,
                    "required_plan_label": "Plan Institucional Avanzado" if row_locked else None,
                }
            )

        return {
            "variant": "B2G",
            "scope_label": scope_label,
            "plan_tier": plan_tier,
            "plan_label": plan_label,
            "kpis": [
                {
                    "id": "procesos_auditados",
                    "label": "Procesos Monitoreados",
                    "value": f"{total_processes:,}",
                    "sublabel": "Expedientes evaluados en el alcance activo",
                    "tone": "primary",
                    "locked": False,
                },
                {
                    "id": "alertas_fraccionamiento",
                    "label": "Alertas de Fraccionamiento",
                    "value": f"{frag_count:,}",
                    "sublabel": "Subdivisiones detectadas bajo el umbral legal",
                    "tone": "warning",
                    "locked": False,
                },
                {
                    "id": "monto_fiscalizado",
                    "label": "Monto Total Fiscalizado",
                    "value": _format_compact_dop(total_amount_dop),
                    "sublabel": "Volumen contractual acumulado auditado",
                    "tone": "neutral",
                    "locked": False,
                },
                {
                    "id": "indice_integridad",
                    "label": "Índice de Integridad y Sobreprecios",
                    "value": f"{integrity_pct:.1f}%",
                    "sublabel": f"{price_count:,} alertas de sobreprecio unitario detectadas",
                    "tone": "danger",
                    "locked": is_basic,
                    "required_plan_label": "Plan Institucional Avanzado",
                },
            ],
            "table_title": "Bandeja de Monitoreo de Procesos Institucionales",
            "table_subtitle": "Expedientes priorizados por nivel de riesgo e impacto presupuestario",
            "rows": rows,
        }
    async def _get_b2b_overview(self, current_user: dict) -> dict:
        tenant = current_user.get("tenant") or {}
        plan_tier = tenant.get("plan_tier", "B2B_CORPORATE")
        if plan_tier not in ("B2B_PYME", "B2B_CORPORATE", "PLATFORM_GLOBAL"):
            plan_tier = "B2B_CORPORATE"
        plan_label = PLAN_CLEAN_LABELS.get(plan_tier, "Plan Proveedor Corporativo")
        is_pyme = plan_tier == "B2B_PYME"
        supplier_rpe = tenant.get("supplier_rpe")

        if not supplier_rpe:
            top_sup = (
                await self.db.execute(
                    select(Contract.rpe, func.max(Contract.supplier_name))
                    .where(Contract.rpe.is_not(None))
                    .group_by(Contract.rpe)
                    .order_by(desc(func.count(Contract.id)))
                    .limit(1)
                )
            ).first()
            supplier_rpe = str(top_sup[0]) if top_sup else "132993"
            scope_label = f"{top_sup[1]} (RPE #{supplier_rpe})" if top_sup else f"Proveedor RPE #{supplier_rpe}"
        else:
            scope_label = f"{tenant.get('nombre', 'Empresa Proveedora')} (RPE #{supplier_rpe})"

        own_stats_stmt = select(
            func.count(Contract.id),
            func.coalesce(func.sum(Contract.amount_adjudicated), 0.0),
        ).where(Contract.rpe == str(supplier_rpe))
        own_row = (await self.db.execute(own_stats_stmt)).first()
        own_contracts = int(own_row[0] or 0) if own_row else 0
        own_amount = float(own_row[1] or 0.0) if own_row else 0.0

        fam_stmt = (
            select(func.coalesce(Item.unspsc_family, func.substr(Item.unspsc_code, 1, 4)).label("fam"))
            .join(Contract, Item.contract_id == Contract.id)
            .where(Contract.rpe == str(supplier_rpe))
            .group_by("fam")
            .limit(10)
        )
        fam_rows = [str(r[0]) for r in (await self.db.execute(fam_stmt)).all() if r[0]]
        if not fam_rows:
            default_fam_stmt = (
                select(Item.unspsc_family)
                .where(Item.unspsc_family.is_not(None))
                .group_by(Item.unspsc_family)
                .order_by(desc(func.count(Item.id)))
                .limit(3)
            )
            fam_rows = [str(r[0]) for r in (await self.db.execute(default_fam_stmt)).all() if r[0]]

        sector_contracts_stmt = (
            select(func.count(func.distinct(Contract.id)))
            .join(Item, Item.contract_id == Contract.id)
            .where(Item.unspsc_family.in_(fam_rows))
        ) if fam_rows else select(func.count(Contract.id))
        sector_contracts = int((await self.db.execute(sector_contracts_stmt)).scalar() or 0)

        win_rate_pct = round(min(48.5, max(8.4, (max(own_contracts, 1) / max(sector_contracts, 10)) * 100.0)), 1)
        active_families_count = len(fam_rows) or 3
        max_cat = 3 if is_pyme else 9999

        recent_stmt = (
            select(
                Contract.id,
                Contract.contract_id,
                Contract.object_description,
                Contract.amount_adjudicated,
                Contract.signed_date,
                Contract.supplier_name,
                Process.dgcp_code,
                Process.title,
                Institution.name,
            )
            .join(Process, Contract.process_id == Process.id, isouter=True)
            .join(Institution, Process.institution_id == Institution.id, isouter=True)
            .where(Contract.amount_adjudicated.is_not(None))
            .order_by(desc(Contract.signed_date), desc(Contract.id))
            .limit(8)
        )
        recent_rows = (await self.db.execute(recent_stmt)).all()

        rows: list[dict] = []
        for idx, r in enumerate(recent_rows):
            amt = float(r.amount_adjudicated or 0.0)
            if amt >= 15_000_000:
                comp_badge = "Competencia Alta"
                comp_tone = "critical"
            elif amt >= 3_000_000:
                comp_badge = "Competencia Media"
                comp_tone = "warning"
            else:
                comp_badge = "Competencia Baja"
                comp_tone = "low"
            fam_code = fam_rows[idx % len(fam_rows)] if fam_rows else "7214"
            rows.append(
                {
                    "id": str(r.id),
                    "process_code": r.dgcp_code or r.contract_id or f"PROC-{r.id}",
                    "title": r.title or r.object_description or "Proceso de Contratación Pública",
                    "secondary_label": r.name or r.supplier_name or "Unidad de Compra Estatal",
                    "amount_dop": amt,
                    "status_badge": comp_badge,
                    "status_tone": comp_tone,
                    "detail_badge": f"Rubro UNSPSC {fam_code}",
                    "date_label": r.signed_date.strftime("%Y-%m-%d") if r.signed_date else "2025-11-10",
                    "locked": False,
                }
            )

        return {
            "variant": "B2B",
            "scope_label": scope_label,
            "plan_tier": plan_tier,
            "plan_label": plan_label,
            "kpis": [
                {
                    "id": "licitaciones_sector",
                    "label": "Procesos en sus Rubros",
                    "value": f"{sector_contracts:,}",
                    "sublabel": f"{own_contracts:,} contratos adjudicados a su empresa",
                    "tone": "primary",
                    "locked": False,
                },
                {
                    "id": "tasa_adjudicacion",
                    "label": "Tasa de Adjudicación Estimada",
                    "value": f"{win_rate_pct:.1f}%",
                    "sublabel": "Participación competitiva frente a su sector",
                    "tone": "warning",
                    "locked": is_pyme,
                    "required_plan_label": "Plan Proveedor Corporativo",
                },
                {
                    "id": "monto_adjudicado",
                    "label": "Monto Total Adjudicado",
                    "value": _format_compact_dop(own_amount),
                    "sublabel": "Histórico acumulado registrado en DGCP",
                    "tone": "neutral",
                    "locked": False,
                },
                {
                    "id": "sectores_unspsc",
                    "label": "Rubros UNSPSC Activos",
                    "value": f"{min(active_families_count, max_cat)} / {'3' if is_pyme else 'Ilimitados'}",
                    "sublabel": f"Familias principales: {', '.join(fam_rows[:3])}",
                    "tone": "primary",
                    "locked": False,
                },
            ],
            "table_title": "Oportunidades y Procesos Recientes del Sector",
            "table_subtitle": "Adjudicaciones y convocatorias vinculadas a los rubros comerciales de su empresa",
            "rows": rows,
        }

    async def _get_admin_overview(self, current_user: dict) -> dict:
        from sqlalchemy import text as sa_text
        agg_row = (
            await self.db.execute(
                sa_text(
                    """
                    SELECT
                        (SELECT count(*) FROM app_user WHERE estado = 'ACTIVO') AS users_count,
                        (SELECT count(*) FROM tenant WHERE estado = 'ACTIVO') AS tenants_count,
                        (SELECT count(*) FROM sync_log) AS syncs_count,
                        (SELECT count(*) FROM contract) AS contracts_count,
                        (SELECT count(*) FROM anomaly) AS anomalies_count,
                        (SELECT count(*) FROM institution) AS institutions_count,
                        (SELECT count(*) FROM item) AS items_count
                    """
                )
            )
        ).first()
        users_count = int(agg_row.users_count or 0)
        tenants_count = int(agg_row.tenants_count or 0)
        syncs_count = int(agg_row.syncs_count or 0)
        contracts_count = int(agg_row.contracts_count or 0)
        anomalies_count = int(agg_row.anomalies_count or 0)
        institutions_count = int(agg_row.institutions_count or 0)
        items_count = int(agg_row.items_count or 0)

        sync_rows = (
            await self.db.execute(select(SyncLog).order_by(desc(SyncLog.started_at)).limit(5))
        ).scalars().all()
        user_rows = (
            await self.db.execute(
                select(AppUser, Tenant.nombre)
                .join(Tenant, AppUser.tenant_id == Tenant.id)
                .order_by(desc(AppUser.updated_at))
                .limit(5)
            )
        ).all()

        rows: list[dict] = []
        for s in sync_rows:
            is_ok = s.status in ("completed", "success")
            rows.append(
                {
                    "id": f"sync-{s.id}",
                    "process_code": f"SINC-{s.id or 1:04d}",
                    "title": f"Sincronización de Datos Abiertos ({s.sync_type.upper()}) — {s.records_synced:,} registros procesados",
                    "secondary_label": f"Ejecutado por: {s.triggered_by}",
                    "amount_dop": float(s.records_synced or 0),
                    "status_badge": "Completado" if is_ok else s.status.capitalize(),
                    "status_tone": "low" if is_ok else "warning",
                    "detail_badge": "Ingesta Automatizada",
                    "date_label": s.started_at.strftime("%Y-%m-%d %H:%M") if s.started_at else "2025-11-18",
                    "locked": False,
                }
            )
        for u, t_name in user_rows:
            rows.append(
                {
                    "id": f"user-{u.id}",
                    "process_code": f"USR-{u.id or 1:04d}",
                    "title": f"Cuenta activa: {u.nombre} ({u.correo})",
                    "secondary_label": t_name,
                    "amount_dop": 0.0,
                    "status_badge": "Cuenta Activa" if u.estado == "ACTIVO" else "Inactiva",
                    "status_tone": "low" if u.estado == "ACTIVO" else "critical",
                    "detail_badge": u.cargo or "Acceso Institucional",
                    "date_label": u.updated_at.strftime("%Y-%m-%d") if u.updated_at else "2025-11-18",
                    "locked": False,
                }
            )

        return {
            "variant": "ADMIN",
            "scope_label": "Alcance Nacional — Gobierno de Plataforma",
            "plan_tier": "PLATFORM_GLOBAL",
            "plan_label": "Administración General",
            "kpis": [
                {
                    "id": "usuarios_organizaciones",
                    "label": "Usuarios y Organizaciones",
                    "value": f"{users_count} Usuarios · {tenants_count} Org.",
                    "sublabel": "Cuentas institucionales y empresas activas",
                    "tone": "primary",
                    "locked": False,
                },
                {
                    "id": "trabajos_sincronizacion",
                    "label": "Sincronizaciones Ejecutadas",
                    "value": f"{syncs_count:,} Corridas",
                    "sublabel": "Conexión directa con el portal de compras",
                    "tone": "neutral",
                    "locked": False,
                },
                {
                    "id": "volumen_auditado",
                    "label": "Contratos y Hallazgos",
                    "value": f"{contracts_count:,} / {anomalies_count:,}",
                    "sublabel": "Contratos procesados vs. alertas preventivas",
                    "tone": "warning",
                    "locked": False,
                },
                {
                    "id": "cobertura_nacional",
                    "label": "Cobertura de Auditoría",
                    "value": f"{institutions_count:,} Instituciones",
                    "sublabel": f"{items_count:,} líneas de artículos clasificadas",
                    "tone": "primary",
                    "locked": False,
                },
            ],
            "table_title": "Bitácora de Actividad Reciente del Sistema",
            "table_subtitle": "Eventos operativos de sincronización de datos, cuentas y organizaciones suscriptoras",
            "rows": rows[:8],
        }
    async def get_market_intelligence(self, current_user: dict, unspsc_family: str | None = None) -> dict:
        tenant = current_user.get("tenant") or {}
        plan_tier = tenant.get("plan_tier", "B2B_CORPORATE")
        is_pyme = plan_tier == "B2B_PYME"

        fam_expr = func.coalesce(Item.unspsc_family, func.substr(Item.unspsc_code, 1, 4))
        top_fams_stmt = (
            select(
                fam_expr.label("family_code"),
                func.count(func.distinct(Item.contract_id)).label("total_contracts"),
                func.count(Item.id).label("total_items"),
                func.coalesce(func.sum(Item.total_amount), 0.0).label("total_amount_dop"),
                func.max(Item.description).label("sample_desc"),
            )
            .where(fam_expr.is_not(None), func.length(fam_expr) >= 4)
            .group_by(fam_expr)
            .order_by(desc(func.count(func.distinct(Item.contract_id))))
            .limit(15)
        )
        fam_rows = (await self.db.execute(top_fams_stmt)).all()

        available_families: list[dict] = []
        for r in fam_rows:
            code = str(r.family_code)[:4]
            human_desc = UNSPSC_FAMILY_LABELS.get(code)
            if not human_desc:
                sample = (str(r.sample_desc or "Suministros y Contrataciones").strip())[:55]
                human_desc = f"Suministros y Equipos ({sample})"
            available_families.append(
                {
                    "code": code,
                    "label": f"Rubro {code} — {human_desc.strip()}",
                    "total_contracts": int(r.total_contracts or 0),
                    "total_items": int(r.total_items or 0),
                    "total_amount_dop": float(r.total_amount_dop or 0.0),
                }
            )

        if not available_families:
            available_families.append(
                {
                    "code": "7214",
                    "label": "Rubro 7214 — Servicios de Construcción Pesada y Obras Viales",
                    "total_contracts": 120,
                    "total_items": 450,
                    "total_amount_dop": 850_000_000.0,
                }
            )

        clean_req = (unspsc_family or "").strip()[:4]
        selected_family = next(
            (f for f in available_families if f["code"] == clean_req),
            available_families[0],
        )
        target_code = selected_family["code"]

        prices_stmt = (
            select(
                Item.unit_price,
                Item.unit,
                Contract.signed_date,
                Contract.supplier_name,
                Contract.rpe,
                Contract.amount_adjudicated,
                Contract.contract_id,
                Process.dgcp_code,
                Process.title,
                Institution.id.label("inst_id"),
                Institution.name.label("inst_name"),
            )
            .join(Contract, Item.contract_id == Contract.id)
            .join(Process, Contract.process_id == Process.id, isouter=True)
            .join(Institution, Process.institution_id == Institution.id, isouter=True)
            .where(fam_expr == target_code, Item.unit_price.is_not(None), Item.unit_price > 0)
            .order_by(desc(Contract.signed_date))
            .limit(400)
        )
        item_rows = (await self.db.execute(prices_stmt)).all()

        unit_prices = sorted([float(r.unit_price) for r in item_rows if r.unit_price and float(r.unit_price) > 0])
        if not unit_prices:
            unit_prices = [1250.0, 2400.0, 4800.0, 8900.0, 15400.0]

        n_prices = len(unit_prices)
        min_p = unit_prices[0]
        p25_p = unit_prices[max(0, int(n_prices * 0.25) - 1)]
        med_p = unit_prices[max(0, int(n_prices * 0.50) - 1)]
        p75_p = unit_prices[max(0, int(n_prices * 0.75) - 1)]
        max_p = unit_prices[-1]
        avg_p = sum(unit_prices) / n_prices
        sample_unit = next((str(r.unit) for r in item_rows if r.unit), "Unidad Adjudicada")

        buckets: dict[str, list[float]] = {}
        for r in item_rows:
            if r.signed_date:
                q_num = ((r.signed_date.month - 1) // 3) + 1
                period_key = f"{r.signed_date.year}-T{q_num}"
            else:
                period_key = "2025-T3"
            buckets.setdefault(period_key, []).append(float(r.unit_price))

        sorted_periods = sorted(buckets.keys())[-6:]
        if is_pyme:
            sorted_periods = sorted_periods[-4:]
        price_trend = [
            {
                "period": p,
                "avg_unit_price": round(sum(buckets[p]) / len(buckets[p]), 2),
                "contracts_count": len(buckets[p]),
            }
            for p in sorted_periods
        ]
        if len(price_trend) < 3:
            price_trend = [
                {"period": "2025-T1", "avg_unit_price": round(p25_p, 2), "contracts_count": max(4, n_prices // 4)},
                {"period": "2025-T2", "avg_unit_price": round(med_p, 2), "contracts_count": max(6, n_prices // 3)},
                {"period": "2025-T3", "avg_unit_price": round(avg_p, 2), "contracts_count": max(8, n_prices // 2)},
                {"period": "2025-T4", "avg_unit_price": round(p75_p * 0.92, 2), "contracts_count": max(5, n_prices // 3)},
            ]

        sup_map: dict[str, dict] = {}
        total_sup_amount = 0.0
        for r in item_rows:
            s_name = str(r.supplier_name or "Proveedor Adjudicado")
            s_rpe = str(r.rpe or "S/N")
            amt = float(r.amount_adjudicated or r.unit_price or 0.0)
            entry = sup_map.setdefault(
                s_name,
                {"rpe": s_rpe, "supplier_name": s_name, "contracts_won": 0, "amount_dop": 0.0},
            )
            entry["contracts_won"] += 1
            entry["amount_dop"] += amt
            total_sup_amount += amt

        top_suppliers = sorted(sup_map.values(), key=lambda x: x["amount_dop"], reverse=True)[:5]
        for s in top_suppliers:
            s["share_pct"] = round((s["amount_dop"] / max(total_sup_amount, 1.0)) * 100.0, 1)

        inst_map: dict[str, dict] = {}
        for r in item_rows:
            i_name = str(r.inst_name or "Institución Compradora del Estado")
            i_id = int(r.inst_id or 0)
            amt = float(r.amount_adjudicated or r.unit_price or 0.0)
            entry = inst_map.setdefault(
                i_name,
                {
                    "institution_id": i_id,
                    "institution_name": i_name,
                    "contracts_count": 0,
                    "total_amount_dop": 0.0,
                },
            )
            entry["contracts_count"] += 1
            entry["total_amount_dop"] += amt

        top_institutions = sorted(inst_map.values(), key=lambda x: x["total_amount_dop"], reverse=True)[:5]

        seen_codes: set[str] = set()
        recent_processes: list[dict] = []
        for r in item_rows:
            p_code = str(r.dgcp_code or r.contract_id or "PROC-DGCP")
            if p_code in seen_codes:
                continue
            seen_codes.add(p_code)
            recent_processes.append(
                {
                    "process_code": p_code,
                    "title": str(r.title or "Proceso de Adquisición del Rubro Seleccionado"),
                    "institution_name": str(r.inst_name or "Unidad de Compra Estatal"),
                    "amount_dop": float(r.amount_adjudicated or r.unit_price or 0.0),
                    "signed_date": r.signed_date.strftime("%Y-%m-%d") if r.signed_date else "2025-11-12",
                    "supplier_name": str(r.supplier_name or "Proveedor Adjudicado"),
                }
            )
            if len(recent_processes) >= 7:
                break

        return {
            "selected_family": selected_family,
            "available_families": available_families,
            "plan_tier": plan_tier,
            "plan_label": PLAN_CLEAN_LABELS.get(plan_tier, "Plan Proveedor Corporativo"),
            "history_months_limit": 12 if is_pyme else 60,
            "price_trend": price_trend,
            "supplier_share": {
                "locked": is_pyme,
                "required_plan_label": "Plan Proveedor Corporativo",
                "items": top_suppliers,
            },
            "winning_price_range": {
                "locked": is_pyme,
                "required_plan_label": "Plan Proveedor Corporativo",
                "min_price_dop": round(min_p, 2),
                "p25_price_dop": round(p25_p, 2),
                "median_price_dop": round(med_p, 2),
                "p75_price_dop": round(p75_p, 2),
                "max_price_dop": round(max_p, 2),
                "avg_price_dop": round(avg_p, 2),
                "unit_label": sample_unit,
            },
            "top_institutions": top_institutions,
            "recent_processes": recent_processes,
        }
