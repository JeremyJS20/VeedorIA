import logging
import re
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
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
    s = re.sub(r"(\.\d{6})\d+", r"\1", value)
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    logger.warning("Unrecognized date format: %s", value)
    return None


def map_contract_from_json(raw: dict) -> dict:
    return {
        "contract_id": raw.get("codigo_contrato", ""),
        "amount_adjudicated": raw.get("valor_contratado"),
        "supplier_name": raw.get("razon_social"),
        "currency": raw.get("divisa"),
        "object_description": raw.get("descripcion"),
        "adjudication_status": raw.get("estado_adjudicacion"),
        "creation_date": raw.get("fecha_creacion_contrato"),
        "signed_date": raw.get("fecha_adjudicacion"),
        "status": raw.get("estado_contrato"),
        "rpe": raw.get("rpe"),
    }


def map_item_from_json(raw: dict) -> dict:
    return {
        "contract_code": str(raw.get("codigo_contrato", "")),
        "process_code": str(raw.get("codigo_proceso", "")),
        "unspsc_family": str(raw.get("familia", "")) or None,
        "unspsc_class": str(raw.get("clase", "")) or None,
        "unspsc_code": str(raw.get("subclase", "")) or None,
        "budget_account": str(raw.get("cuenta_presupuestaria")) or None,
        "description": str(raw.get("descripcion_articulo", "")),
        "total_amount": raw.get("costo_total"),
        "unit": str(raw.get("unidad_medida")) or None,
        "quantity": float(raw["cantidad"]) if raw.get("cantidad") else 1.0,
        "unit_price": raw.get("precio_unitario"),
    }


def map_institution_from_json(raw: dict) -> dict:
    return {
        "dgcp_id": str(raw.get("codigo_unidad_compra", "")),
        "name": raw.get("unidad_compra", ""),
    }


def map_process_from_json(raw: dict) -> dict:
    return {
        "dgcp_code": str(raw.get("codigo_proceso", "")),
        "title": str(raw.get("objeto") or raw.get("descripcion") or ""),
        "institution_dgcp_id": str(raw.get("codigo_unidad_compra", "")),
    }


def map_supplier_from_json(raw: dict) -> dict:
    return {
        "numero_documento": str(raw.get("numero_documento", "")),
        "nombre": raw.get("razon_social"),
        "telefono": raw.get("telefono_comercial"),
        "correo_electronico": raw.get("correo_comercial"),
        "direccion": raw.get("direccion"),
        "status": raw.get("estado"),
        "is_mipyme": raw.get("es_mipyme") == "Sí",
        "classification": raw.get("clasificacion"),
        "supplier_type": raw.get("provee"),
        "province": raw.get("provincia"),
        "municipality": raw.get("municipio"),
    }


async def get_last_sync(session: AsyncSession) -> SyncLog | None:
    stmt = (
        select(SyncLog)
        .where(SyncLog.status == "completed")
        .order_by(SyncLog.completed_at.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _import_items_from_json(
    client: DGCPClient,
    session: AsyncSession,
) -> int:
    logger.info("Fetching items via JSON API (streaming)...")

    stmt = select(Contract.id, Contract.contract_id)
    result = await session.execute(stmt)
    contract_map: dict[str, int] = {}
    for row in result:
        if row.contract_id:
            contract_map[row.contract_id] = row.id
    logger.info("Loaded %d contracts from DB", len(contract_map))

    batch = []
    count = 0
    page = 1

    errors = 0

    while True:
        try:
            raw = await client._request("/contratos/articulos", {"limit": 1000, "page": page})
        except Exception:
            logger.exception("Items page %d failed (skipping)", page)
            errors += 1
            if errors >= 3:
                logger.error("Too many item page errors (%d), aborting", errors)
                break
            page += 1
            continue

        payload = client._extract_payload(raw)
        if payload is None or not payload.data:
            break

        matched_in_page = 0
        for raw_item in payload.data:
            mapped = map_item_from_json(raw_item)
            contract_db_id = contract_map.get(mapped["contract_code"])
            if not contract_db_id:
                continue
            matched_in_page += 1

            batch.append(Item(
                contract_id=contract_db_id,
                description=mapped["description"],
                quantity=mapped["quantity"],
                unit=mapped["unit"],
                unit_price=mapped["unit_price"],
                total_amount=mapped["total_amount"],
                unspsc_code=mapped["unspsc_code"],
                process_code=mapped["process_code"] or None,
                unspsc_family=mapped["unspsc_family"] or None,
                unspsc_class=mapped["unspsc_class"] or None,
                budget_account=mapped["budget_account"] or None,
            ))
            count += 1

            if len(batch) >= 5000:
                session.add_all(batch)
                await session.commit()
                batch.clear()
                logger.info("Items progress: page %d/%d, %d items", page, payload.pages, count)

        errors = 0

        if matched_in_page == 0 and page > 1:
            logger.info("Early-break at page %d: no items matched any contract", page)
            break

        if page >= payload.pages:
            break
        page += 1

    if batch:
        session.add_all(batch)
        await session.commit()
    logger.info("Items JSON import complete: %d items", count)
    return count


async def _import_suppliers_from_json(
    client: DGCPClient,
    session: AsyncSession,
) -> int:
    logger.info("Fetching suppliers via JSON API (streaming)...")
    batch = []
    count = 0
    page = 1

    errors = 0

    while True:
        try:
            raw = await client._request("/proveedores", {"limit": 1000, "page": page})
        except Exception:
            logger.exception("Suppliers page %d failed (skipping)", page)
            errors += 1
            if errors >= 3:
                logger.error("Too many supplier page errors (%d), aborting", errors)
                break
            page += 1
            continue

        payload = client._extract_payload(raw)
        if payload is None or not payload.data:
            break

        for raw_item in payload.data:
            mapped = map_supplier_from_json(raw_item)
            rnc = mapped["numero_documento"]
            if not rnc:
                continue

            batch.append(Supplier(
                rnc=rnc,
                registered_name=mapped["nombre"],
                phone=mapped["telefono"],
                email=mapped["correo_electronico"],
                address=mapped["direccion"],
                status=mapped["status"],
                is_mipyme=mapped["is_mipyme"],
                classification=mapped["classification"],
                supplier_type=mapped["supplier_type"],
                province=mapped["province"],
                municipality=mapped["municipality"],
            ))
            count += 1

            if len(batch) >= 5000:
                session.add_all(batch)
                await session.commit()
                batch.clear()

        logger.info("Suppliers progress: page %d/%d, %d suppliers", page, payload.pages, count)
        errors = 0
        if page >= payload.pages:
            break
        page += 1

    if batch:
        session.add_all(batch)
        await session.commit()
    logger.info("Suppliers JSON import complete: %d suppliers", count)
    return count


async def _import_institutions_from_json(
    client: DGCPClient,
    session: AsyncSession,
) -> int:
    logger.info("Fetching all institutions via JSON API...")
    institutions_raw = await client.fetch_institutions()
    logger.info("Fetched %d institutions from JSON API", len(institutions_raw))

    batch = []
    count = 0
    for raw in institutions_raw:
        mapped = map_institution_from_json(raw)
        if not mapped["dgcp_id"]:
            continue

        batch.append(Institution(
            dgcp_id=mapped["dgcp_id"],
            name=mapped["name"],
        ))
        count += 1

        if len(batch) >= 5000:
            session.add_all(batch)
            await session.commit()
            batch.clear()

    if batch:
        session.add_all(batch)
        await session.commit()
    logger.info("Institutions imported: %d", count)
    return count


async def _import_processes_from_json(
    client: DGCPClient,
    session: AsyncSession,
    institution_map: dict[str, int] | None = None,
    days_back: int = 90,
) -> int:
    logger.info("Fetching processes via JSON API (streaming)...")
    cutoff = date.today() - timedelta(days=days_back)
    batch = []
    count = 0
    page = 1

    while True:
        raw = await client._request("/procesos", {"limit": 1000, "page": page, "startdate": cutoff.isoformat()})
        payload = client._extract_payload(raw)
        if payload is None or not payload.data:
            break

        for raw_item in payload.data:
            mapped = map_process_from_json(raw_item)
            if not mapped["dgcp_code"]:
                continue

            institution_id = None
            if institution_map is not None and mapped["institution_dgcp_id"]:
                institution_id = institution_map.get(mapped["institution_dgcp_id"])

            batch.append(Process(
                dgcp_code=mapped["dgcp_code"],
                title=mapped["title"],
                institution_id=institution_id,
            ))
            count += 1

            if len(batch) >= 5000:
                session.add_all(batch)
                await session.commit()
                batch.clear()

        logger.info("Processes progress: page %d/%d, %d processes", page, payload.pages, count)
        if page >= payload.pages:
            break
        page += 1

    if batch:
        session.add_all(batch)
        await session.commit()
    logger.info("Processes imported: %d", count)
    return count


async def _import_contracts_from_json(
    client: DGCPClient,
    session: AsyncSession,
    process_map: dict[str, int],
    days_back: int = 90,
) -> int:
    logger.info("Fetching contracts via JSON API (streaming)...")
    cutoff = date.today() - timedelta(days=days_back)

    batch = []
    count = 0
    page = 1

    errors = 0

    while True:
        try:
            raw = await client._request("/contratos", {"limit": 1000, "page": page})
        except Exception:
            logger.exception("Contracts page %d failed (skipping)", page)
            errors += 1
            if errors >= 3:
                logger.error("Too many contract page errors (%d), aborting", errors)
                break
            page += 1
            continue

        payload = client._extract_payload(raw)
        if payload is None or not payload.data:
            break

        recent_in_page = 0
        for raw_item in payload.data:
            fecha_str = raw_item.get("fecha_adjudicacion") or raw_item.get("fecha_creacion_contrato")
            if fecha_str:
                fecha = parse_date(str(fecha_str))
                if fecha and fecha.date() < cutoff:
                    continue
                recent_in_page += 1

            mapped = map_contract_from_json(raw_item)
            process_code = raw_item.get("codigo_proceso", "")
            process_id = process_map.get(process_code)

            contract_id = mapped["contract_id"]
            if not contract_id:
                continue

            batch.append(Contract(
                process_id=process_id,
                contract_id=contract_id,
                amount_adjudicated=mapped["amount_adjudicated"],
                supplier_name=mapped["supplier_name"],
                currency=mapped["currency"],
                object_description=mapped["object_description"],
                adjudication_status=mapped["adjudication_status"],
                status=mapped["status"],
                rpe=mapped["rpe"],
                signed_date=parse_date(str(mapped["signed_date"])) if mapped["signed_date"] else None,
                creation_date=parse_date(str(mapped["creation_date"])) if mapped["creation_date"] else None,
            ))
            count += 1

            if len(batch) >= 5000:
                session.add_all(batch)
                await session.commit()
                batch.clear()

        logger.info("Contracts progress: page %d/%d, %d contracts", page, payload.pages, count)
        errors = 0

        if recent_in_page == 0 and page > 1:
            logger.info("Early-break at page %d: all %d contracts older than %s", page, len(payload.data), cutoff)
            break

        if page >= payload.pages:
            break
        page += 1

    if batch:
        session.add_all(batch)
        await session.commit()
    logger.info("Phase 2/5 complete: %d contracts", count)
    return count


async def sync_full(
    client: DGCPClient,
    session: AsyncSession,
    days_back: int = 90,
    skip_institutions: bool = False,
    skip_processes: bool = False,
    skip_contracts: bool = False,
    skip_items: bool = False,
    skip_suppliers: bool = False,
) -> tuple[int, int, int, int, int]:
    logger.info("Starting full sync: JSON institutions + JSON processes + JSON contracts + JSON items + JSON suppliers")

    # Wipe all FK-dependent tables first (reverse FK dependency order)
    await session.execute(text("DELETE FROM audit_log"))
    await session.execute(text("DELETE FROM anomaly"))
    await session.execute(text("DELETE FROM item"))
    await session.execute(text("DELETE FROM contract"))
    await session.execute(text("DELETE FROM process"))
    await session.execute(text("DELETE FROM institution"))
    await session.execute(text("DELETE FROM supplier"))
    await session.commit()
    logger.info("Database wiped — all tables cleaned before full re-import")

    institution_count = 0
    if skip_institutions:
        logger.info("Phase 0/5: Skipping institutions (--skip-institutions)")
    else:
        logger.info("Phase 0/5: Fetching all institutions via JSON API...")
        institution_count = await _import_institutions_from_json(client, session)

    stmt = select(Institution.dgcp_id, Institution.id)
    result = await session.execute(stmt)
    institution_map: dict[str, int] = {}
    for row in result:
        if row.dgcp_id:
            institution_map[row.dgcp_id] = row.id
    logger.info("Loaded %d institutions from DB", len(institution_map))

    process_count = 0
    if skip_processes:
        logger.info("Phase 1/5: Skipping processes (--skip-processes)")
    else:
        logger.info("Phase 1/5: Fetching all processes via JSON API...")
        process_count = await _import_processes_from_json(client, session, institution_map=institution_map, days_back=days_back)

    stmt = select(Process.dgcp_code, Process.id)
    result = await session.execute(stmt)
    process_map: dict[str, int] = {}
    for row in result:
        if row.dgcp_code:
            process_map[row.dgcp_code] = row.id
    logger.info("Loaded %d processes from DB", len(process_map))

    contract_count = 0

    if skip_contracts:
        logger.info("Phase 2/5: Skipping contracts (--skip-contracts)")
    else:
        logger.info("Phase 2/5: Fetching all contracts via JSON API...")
        contract_count = await _import_contracts_from_json(client, session, process_map=process_map, days_back=days_back)

    item_count = 0
    if not skip_items:
        logger.info("Phase 3/5: Fetching items via JSON API...")
        try:
            item_count = await _import_items_from_json(client, session)
            logger.info("Phase 3/5 complete: %d items", item_count)
        except Exception:
            logger.exception("Failed to sync items from JSON API")

    supplier_count = 0
    if not skip_suppliers:
        logger.info("Phase 4/5: Fetching suppliers via JSON API...")
        try:
            supplier_count = await _import_suppliers_from_json(client, session)
            logger.info("Phase 4/5 complete: %d suppliers", supplier_count)
        except Exception:
            logger.exception("Failed to sync suppliers from JSON API")

    logger.info("Full sync finished: %d institutions, %d processes, %d contracts, %d items, %d suppliers",
                institution_count, process_count, contract_count, item_count, supplier_count)
    return (institution_count, process_count, contract_count, item_count, supplier_count)


async def sync_incremental_optimized(
    client: DGCPClient,
    session: AsyncSession,
) -> tuple[int, int, int]:
    last = await get_last_sync(session)
    if last and last.completed_at:
        since = last.completed_at
    else:
        since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    logger.info("Incremental sync since %s", since)

    contracts_raw = await client.fetch_all_contracts()

    stmt = select(Process.dgcp_code, Process.id)
    result = await session.execute(stmt)
    process_map: dict[str, int] = {}
    for row in result:
        if row.dgcp_code:
            process_map[row.dgcp_code] = row.id

    contract_count = 0
    new_contract_codes: list[str] = []

    for raw in contracts_raw:
        creation_str = raw.get("fecha_creacion_contrato")
        if not creation_str:
            continue
        creation = parse_date(str(creation_str))
        if not creation or creation < since:
            continue

        mapped = map_contract_from_json(raw)
        process_code = raw.get("codigo_proceso", "")
        process_id = process_map.get(process_code)
        contract_id = mapped["contract_id"]
        if not contract_id:
            continue

        stmt = select(Contract).where(
            Contract.contract_id == contract_id,
            Contract.process_id == process_id,
        )
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.amount_adjudicated = mapped["amount_adjudicated"]
            existing.status = mapped["status"]
            existing.signed_date = parse_date(str(mapped["signed_date"])) if mapped["signed_date"] and not existing.signed_date else existing.signed_date
        else:
            contract = Contract(
                process_id=process_id,
                contract_id=contract_id,
                amount_adjudicated=mapped["amount_adjudicated"],
                supplier_name=mapped["supplier_name"],
                currency=mapped["currency"],
                object_description=mapped["object_description"],
                adjudication_status=mapped["adjudication_status"],
                status=mapped["status"],
                rpe=mapped["rpe"],
                signed_date=parse_date(str(mapped["signed_date"])) if mapped["signed_date"] else None,
                creation_date=creation,
            )
            session.add(contract)

        contract_count += 1
        new_contract_codes.append(contract_id)

    await session.commit()
    logger.info("Incremental contracts: %d new/updated", contract_count)

    item_count = 0
    for code in new_contract_codes:
        stmt = select(Contract).where(Contract.contract_id == code)
        result = await session.execute(stmt)
        ct = result.scalar_one_or_none()
        if not ct or not ct.id:
            continue
        stmt2 = select(Process.dgcp_code).where(Process.id == ct.process_id)
        result2 = await session.execute(stmt2)
        proc_code_row = result2.first()
        if not proc_code_row or not proc_code_row[0]:
            continue
        proc_code = proc_code_row[0]
        try:
            items = await client.fetch_contract_items(proc_code, code)
            for i_raw in items:
                stmt3 = select(Item).where(
                    Item.contract_id == ct.id,
                    Item.description == i_raw.get("descripcion", i_raw.get("articulo", "")),
                )
                result3 = await session.execute(stmt3)
                existing = result3.scalar_one_or_none()
                if existing:
                    existing.quantity = float(i_raw.get("cantidad") or 1)
                    existing.unit_price = i_raw.get("precio_unitario") or existing.unit_price
                    existing.total_amount = i_raw.get("monto_total", i_raw.get("monto")) or existing.total_amount
                else:
                    item = Item(
                        contract_id=ct.id,
                        description=i_raw.get("descripcion", i_raw.get("articulo", "")),
                        quantity=float(i_raw.get("cantidad") or 1),
                        unit=i_raw.get("unidad_medida"),
                        unit_price=i_raw.get("precio_unitario"),
                        total_amount=i_raw.get("monto_total", i_raw.get("monto")),
                        unspsc_code=str(i_raw.get("codigo_unspc") or i_raw.get("subclase") or "")[:8] or None,
                    )
                    session.add(item)
                item_count += 1
        except Exception:
            logger.warning("Failed to fetch items for contract %s", code)

    await session.commit()

    supplier_count = 0
    all_rncs = set()
    for raw in contracts_raw:
        creation_str = raw.get("fecha_creacion_contrato")
        if not creation_str:
            continue
        creation = parse_date(str(creation_str))
        if creation and creation >= since:
            rnc = raw.get("numero_documento")
            if rnc:
                all_rncs.add(str(rnc))

    for rnc in all_rncs:
        try:
            suppliers = await client.fetch_suppliers(rnc=rnc)
            for s_raw in suppliers:
                rnc_val = str(s_raw.get("numero_documento", ""))
                if not rnc_val:
                    continue
                stmt = select(Supplier).where(Supplier.rnc == rnc_val)
                result = await session.execute(stmt)
                existing = result.scalar_one_or_none()
                if existing:
                    existing.registered_name = s_raw.get("nombre", s_raw.get("nombre_registrado")) or existing.registered_name
                else:
                    sup = Supplier(
                        rnc=rnc_val,
                        registered_name=s_raw.get("nombre", s_raw.get("nombre_registrado")),
                        trade_name=s_raw.get("nombre_comercial"),
                        phone=s_raw.get("telefono"),
                        email=s_raw.get("correo_electronico"),
                        address=s_raw.get("direccion"),
                    )
                    session.add(sup)
                supplier_count += 1
        except Exception:
            logger.warning("Failed to fetch supplier %s", rnc)

    await session.commit()
    logger.info("Incremental sync finished: %d contracts, %d items, %d suppliers",
                contract_count, item_count, supplier_count)
    return (contract_count, item_count, supplier_count)


async def run_sync(
    session: AsyncSession,
    full: bool = False,
    days_back: int | None = None,
    skip_institutions: bool = False,
    skip_processes: bool = False,
    skip_contracts: bool = False,
    skip_items: bool = False,
    skip_suppliers: bool = False,
    rate_limit: float | None = None,
    triggered_by: str = "cli",
    sync_log_id: int | None = None,
    sync_type: str | None = None,
) -> SyncLog:
    if sync_log_id:
        stmt = select(SyncLog).where(SyncLog.id == sync_log_id)
        result = await session.execute(stmt)
        sync_log = result.scalar_one()
    else:
        sync_log = SyncLog(status="running", triggered_by=triggered_by, sync_type=sync_type or "full")
        session.add(sync_log)
        await session.commit()
        await session.refresh(sync_log)

    try:
        async with DGCPClient(rate_limit=rate_limit) as client:
            if full:
                inst, p, c, i, s = await sync_full(
                    client, session,
                    days_back=settings.sync_days_back if days_back is None else days_back,
                    skip_institutions=skip_institutions,
                    skip_processes=skip_processes,
                    skip_contracts=skip_contracts,
                    skip_items=skip_items,
                    skip_suppliers=skip_suppliers,
                )
            else:
                c, i, s = await sync_incremental_optimized(client, session)
                inst, p = 0, 0
            records_synced = inst + p + c + i + s
        sync_log.records_synced = records_synced
        sync_log.status = "completed"
        sync_log.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()
        logger.info("Sync %d completed: %d records", sync_log.id, records_synced)
    except Exception as e:
        logger.exception("Sync %d failed: %s", sync_log.id, e)
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        sync_log.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()

    await session.refresh(sync_log)
    return sync_log
