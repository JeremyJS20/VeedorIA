# Plan: Optimizaciones de Rate Limit + Sync Completo para Dev

## Objetivo
Optimizar el rate limit del DGCPClient y ejecutar un sync completo con `--days-back 90` para obtener datos reales de contratos, items y suppliers para desarrollo.

## Problema actual
- El sync actual usa OCDS releases que retornan ~98% de datos NULL
- Solo 40 de 1,720 contratos tienen datos reales
- 0 items, 0 suppliers en la DB
- Rate limit es secuencial (0.2 req/s), sin concurrencia

## Solución

### 1. Token Bucket + Semaphore en `dgcp_client.py`
- Implementar rate limiter con burst de 3 tokens
- Agregar `asyncio.Semaphore(3)` para requests concurrentes
- Throughput efectivo: 0.6 req/s (3x más rápido)

### 2. Nuevo `sync_contracts_via_dgcp()` en `sync_service.py`
- Reemplaza `sync_contracts_via_ocds()`
- Usa `/contratos?proceso=X` en vez de OCDS releases
- Usa `/contratos/articulos?proceso=X&contrato=Y` para items
- Usa `/proveedores?numero_documento=RNC` para suppliers
- Filtra solo procesos con status "Proceso adjudicado y celebrado"
- Batch commits cada 50 procesos

### 3. Actualizar `sync_full()` para usar nueva función

### 4. Limpiar ghost rows
```sql
DELETE FROM item WHERE contract_id IN (SELECT id FROM contract WHERE contract_id = '');
DELETE FROM contract WHERE contract_id = '';
```

## Sync a ejecutar
```bash
python -m src.cli.sync_dgcp --sync-type contracts --days-back 90 --rate-limit 0.2
```

## Estimación de tiempo
- Contracts: ~1,700 requests (~47 min)
- Items: ~2,500 requests (~70 min)
- Suppliers: ~1,000 requests (~28 min)
- **Total: ~5,200 requests en ~3.5 horas**

## Data resultante
- ~2,000 contracts con montos, RNC, fechas, estado REALES
- ~10,000 items con descripciones, cantidades, precios, UNSPSC REALES
- ~1,000 suppliers con nombres, teléfonos, emails, direcciones REALES

## Archivos a modificar
- `backend/src/infrastructure/dgcp_client.py` — token bucket + semaphore
- `backend/src/services/sync_service.py` — nuevo `sync_contracts_via_dgcp()`
- `backend/tests/unit/test_sync_service.py` — tests actualizados
