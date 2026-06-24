import logging
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.dgcp_client import DGCPClient
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.item import Item
from src.models.process import Process
from src.models.supplier import Supplier
from src.models.sync_log import SyncLog

logger = logging.getLogger("veedoria.services.sync_service")


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def extract_dgcp_id(raw: dict) -> str:
    code = raw.get("codigo_unidad_compra")
    return str(code) if code is not None else raw.get("codigo_proceso", "unknown")


def map_institution(raw: dict) -> Institution:
    name = raw.get("unidad_compra") or raw.get("nombre", "")
    return Institution(
        dgcp_id=extract_dgcp_id(raw),
        name=name,
        acronym=raw.get("siglas"),
        sector=raw.get("sector"),
    )


def map_process(raw: dict) -> Process:
    ocid = raw.get("codigo_proceso", "")
    return Process(
        ocid=f"ocds-6550wx-{ocid}",
        dgcp_code=ocid,
        title=raw.get("titulo", ""),
        procurement_method=raw.get("modalidad"),
        status=raw.get("estado_proceso"),
        estimated_amount=raw.get("monto_estimado"),
        currency=raw.get("divisa", "DOP"),
        published_date=parse_date(raw.get("fecha_publicacion")),
        deadline_date=parse_date(raw.get("fecha_fin_recepcion_ofertas")),
    )


def map_contract(raw: dict) -> Contract:
    return Contract(
        contract_id=raw.get("contrato", raw.get("codigo_contrato", "")),
        amount_adjudicated=raw.get("monto_adjudicado", raw.get("monto")),
        supplier_rnc=raw.get("rpe") or raw.get("rnc"),
        signed_date=parse_date(raw.get("fecha_suscripcion")),
        start_date=parse_date(raw.get("fecha_inicio")),
        end_date=parse_date(raw.get("fecha_fin")),
        status=raw.get("estado_contrato", raw.get("estado")),
    )


def map_supplier(raw: dict) -> Supplier:
    return Supplier(
        rnc=str(raw.get("numero_documento", "")),
        registered_name=raw.get("nombre", raw.get("nombre_registrado")),
        trade_name=raw.get("nombre_comercial"),
        phone=raw.get("telefono"),
        email=raw.get("correo_electronico"),
        address=raw.get("direccion"),
    )


def map_item(raw: dict) -> Item:
    return Item(
        description=raw.get("descripcion", raw.get("articulo", "")),
        quantity=float(raw.get("cantidad", 1)),
        unit=raw.get("unidad_medida"),
        unit_price=raw.get("precio_unitario"),
        total_amount=raw.get("monto_total", raw.get("monto")),
        unspsc_code=str(raw.get("codigo_unspc", raw.get("subclase", "")))[:8] or None,
    )


async def upsert_institution(session: AsyncSession, raw: dict) -> Institution | None:
    dgcp_id = extract_dgcp_id(raw)
    stmt = select(Institution).where(Institution.dgcp_id == dgcp_id)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    data = map_institution(raw)
    if existing:
        existing.name = data.name
        existing.acronym = data.acronym
        existing.sector = data.sector
        return existing
    session.add(data)
    await session.flush()
    return data


async def find_institution_by_name(session: AsyncSession, name: str) -> Institution | None:
    stmt = select(Institution).where(Institution.name.contains(name[:50]))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def upsert_process(session: AsyncSession, raw: dict, institution_id: int | None) -> Process | None:
    ocid = f"ocds-6550wx-{raw.get('codigo_proceso', '')}"
    stmt = select(Process).where(Process.ocid == ocid)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    data = map_process(raw)
    data.institution_id = institution_id
    if existing:
        existing.title = data.title
        existing.status = data.status
        existing.estimated_amount = data.estimated_amount
        existing.published_date = data.published_date
        existing.deadline_date = data.deadline_date
        existing.institution_id = data.institution_id
        return existing
    session.add(data)
    await session.flush()
    return data


async def upsert_contract(session: AsyncSession, raw: dict, process_id: int) -> Contract | None:
    contract_id = raw.get("contrato", raw.get("codigo_contrato", ""))
    stmt = select(Contract).where(Contract.contract_id == contract_id)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    data = map_contract(raw)
    data.process_id = process_id
    if existing:
        existing.amount_adjudicated = data.amount_adjudicated
        existing.supplier_rnc = data.supplier_rnc
        existing.status = data.status
        return existing
    session.add(data)
    await session.flush()
    return data


async def upsert_supplier(session: AsyncSession, raw: dict) -> Supplier | None:
    rnc = str(raw.get("numero_documento", ""))
    if not rnc:
        return None
    stmt = select(Supplier).where(Supplier.rnc == rnc)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    data = map_supplier(raw)
    if existing:
        existing.registered_name = data.registered_name or existing.registered_name
        existing.phone = data.phone or existing.phone
        return existing
    session.add(data)
    await session.flush()
    return data


async def sync_full(
    client: DGCPClient,
    session: AsyncSession,
    start_date: date,
    end_date: date,
) -> int:
    logger.info("Starting full sync: %s to %s", start_date, end_date)
    total = 0

    institutions_data = await client.fetch_institutions()
    for raw in institutions_data:
        await upsert_institution(session, raw)
    await session.commit()
    logger.info("Institutions synced: %d", len(institutions_data))

    processes_data = await client.fetch_processes(start_date, end_date)
    for raw in processes_data:
        inst_name = raw.get("unidad_compra", "")
        inst = await find_institution_by_name(session, inst_name)
        process = await upsert_process(session, raw, inst.id if inst else None)
        if process and raw.get("codigo_proceso"):
            contracts_data = await client.fetch_contracts(raw["codigo_proceso"])
            for c_raw in contracts_data:
                await upsert_contract(session, c_raw, process.id)
                rnc = c_raw.get("rpe") or c_raw.get("rnc")
                if rnc:
                    suppliers_data = await client.fetch_suppliers(rnc)
                    for s_raw in suppliers_data:
                        await upsert_supplier(session, s_raw)
        total += 1
        if total % 100 == 0:
            await session.commit()
            logger.info("Progress: %d processes synced", total)
    await session.commit()
    logger.info("Full sync completed: %d processes", total)
    return total


async def get_last_sync(session: AsyncSession) -> SyncLog | None:
    stmt = (
        select(SyncLog)
        .where(SyncLog.status == "completed")
        .order_by(SyncLog.completed_at.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def sync_incremental(client: DGCPClient, session: AsyncSession) -> int:
    last = await get_last_sync(session)
    if last and last.completed_at:
        start = last.completed_at.date()
    else:
        start = date(2020, 2, 1)
    end = date.today()
    return await sync_full(client, session, start, end)


async def run_sync(
    session: AsyncSession,
    start_date: date | None = None,
    end_date: date | None = None,
    incremental: bool = False,
    triggered_by: str = "cli",
) -> SyncLog:
    sync_log = SyncLog(
        status="running",
        triggered_by=triggered_by,
    )
    session.add(sync_log)
    await session.commit()
    await session.refresh(sync_log)

    try:
        async with DGCPClient() as client:
            if incremental:
                records = await sync_incremental(client, session)
            else:
                records = await sync_full(
                    client,
                    session,
                    start_date or date(2020, 2, 1),
                    end_date or date.today(),
                )
        sync_log.records_synced = records
        sync_log.status = "completed"
        sync_log.completed_at = datetime.now(timezone.utc)
        await session.commit()
        logger.info("Sync %d completed: %d records", sync_log.id, records)
    except Exception as e:
        logger.exception("Sync %d failed: %s", sync_log.id, e)
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        sync_log.completed_at = datetime.now(timezone.utc)
        await session.commit()

    await session.refresh(sync_log)
    return sync_log
