<!-- scanner:2026-10-18 -->
# External Integrations

> 📋 Generado por `project-scanner` el 2026-10-18 a partir de `app/backend/src/infrastructure/dgcp_client.py` y archivos de despliegue.

## Active Integrations
| Service | Purpose | Protocol | Auth | Environment Config |
|---------|---------|----------|------|--------------------|
| API de Datos Abiertos DGCP (`datosabiertos.dgcp.gob.do`) | Ingesta de procesos, contratos, artículos adjudicados, instituciones y proveedores del Estado dominicano | HTTPS REST (JSON / XLSX) | Público (Datos Abiertos) | `DGCP_API_BASE_URL`, `SYNC_RATE_LIMIT` |
| Redis (`arq` Queue) | Encolamiento y ejecución distribuida de tareas de sincronización (`run_sync`) y detección (`run_detection`) | TCP (`redis://`) | URL / Password | `REDIS_URL` |

## Platform Integrations
### Render (`app/backend/render.yaml`)
| Aspecto | Detalle |
|---------|---------|
| **Servicios definidos** | `veedoria-api` (Web Docker), `veedoria-worker` (Worker Docker `arq`), `veedoria-redis` (Redis) |
| **Configuración** | Blueprint IaC en `app/backend/render.yaml` |
| **Variables enlazadas** | `REDIS_URL` inyectada desde `veedoria-redis`; `JWT_SECRET` autogenerado y compartido entre `api` y `worker`; `DATABASE_URL` configurada en panel |

## Integration Details

### API de Datos Abiertos DGCP (`DGCPClient` — `app/backend/src/infrastructure/dgcp_client.py`)
- **URL Base**: `https://datosabiertos.dgcp.gob.do/api-dgcp/v1` (`settings.dgcp_api_base_url`)
- **Autenticación**: No requiere token (API pública gubernamental)
- **Rate Limits**: Controlado en el cliente mediante `sync_rate_limit: float = 5.0` req/s
- **Timeouts y Reintentos**:
  - `dgcp_request_timeout`: `30` segundos
  - `dgcp_max_retries`: `3` intentos con backoff exponencial (`dgcp_retry_base_delay = 1.0`s)
- **Manejo de errores**: Excepción tipada `DGCPClientError` y registro de estado `failed` con detalle en la tabla `sync_log`.

### Flujo de Sincronización DGCP
```mermaid
sequenceDiagram
    participant Trigger as API / APScheduler / CLI
    participant Redis as Redis (arq)
    participant Worker as arq Worker
    participant DGCP as API Datos Abiertos DGCP
    participant DB as PostgreSQL / SQLite

    Trigger->>+Redis: Encolar job run_sync
    Redis->>+Worker: Despachar tarea
    Worker->>DB: Crear registro SyncLog (status: running)
    loop Paginación con Rate Limit (5 req/s)
        Worker->>+DGCP: GET lotes paginados (procesos, contratos, ítems, proveedores)
        DGCP-->>-Worker: Payload JSON / XLSX
        Worker->>DB: Upsert por lotes (SYNC_BATCH_SIZE = 500)
    end
    Worker->>DB: Actualizar SyncLog (status: completed, records_synced)
    Worker-->>-Redis: Job finalizado
```

## Circuit Breaker Pattern
- En `DGCPClient._request` se aplica control de tasa preventivo y hasta `3` reintentos con espera exponencial ante fallos transitorios de red o códigos `5xx`/`429` del portal de Datos Abiertos.
- Si una corrida queda interrumpida por reinicio del contenedor, el `lifespan` de FastAPI marca automáticamente los registros `SyncLog` en estado `running` como `failed` (`error_message = 'server_restart'`), desbloqueando nuevas ejecuciones.

## Health Checks
| Integración | Método de verificación | Intervalo | Timeout | Acción en fallo |
|-------------|----------------------|-----------|---------|-----------------|
| Redis (`docker-compose.yml`) | `redis-cli ping` | `5s` | `3s` (5 reintentos) | Retrasa inicio de `api` y `worker` (`service_healthy`) |
| Sincronización DGCP | `GET /api/sync/status` (`SyncLog`) | Por solicitud / Diario 06:00 | `30s` por request | Registra `error_message` en `sync_log` |

## Interoperabilidad Externa B2G (`/api/integration/*` — Llaves `vdia_b2g_...`)

Los sistemas gubernamentales externos (**SIGEF**, **Contraloría General de la República**, **Cámara de Cuentas** y **ERPs institucionales**) pueden consumir en tiempo real los hallazgos, resúmenes de cumplimiento e historial de dictámenes de su institución mediante credenciales emitidas en `/app/integraciones` (`B2GIntegrationsPage.tsx`).

### 1. Autenticación y Aislamiento Automático por Institución (`institution_id`)
- **Formato del Token**: `vdia_b2g_<key_id_12hex>_<secret_urlsafe>`
- **Almacenamiento Seguro**: En base de datos (`audit_log`, `entity_type = 'integration_key'`) solo se almacena el prefijo enmascarado (`vdia_b2g_xxxx••••yyyy`) y el **hash SHA-256** del secreto. El valor en texto plano se muestra únicamente una vez al momento de su emisión.
- **Cabeceras HTTP soportadas**:
  - `X-Integration-Key: vdia_b2g_<key_id>_<secret>` *(recomendada)*
  - `Authorization: Bearer vdia_b2g_<key_id>_<secret>`
- **Aislamiento Multi-Tenant Automático**: `resolve_integration_caller()` identifica la organización (`tenant_id`) propietaria de la llave y filtra automáticamente todas las consultas por su `institution_id` (o alcance nacional si la llave pertenece a `PLATFORM_ADMIN` / `GOV_OVERSIGHT`).
- **Revocación Instantánea**: Al ejecutar `DELETE /api/auditor/integrations/keys/{key_id}`, se inserta un evento `REVOKE_INTEGRATION_KEY` en `audit_log` y cualquier petición subsiguiente con esa llave recibe inmediatamente `401 Unauthorized` (`INVALID_INTEGRATION_KEY`).

### 2. Endpoints de Interoperabilidad Externa

| Método | Ruta | Parámetros Query | Descripción |
|--------|------|------------------|-------------|
| `GET` | `/api/integration/anomalies` | `anomaly_type`, `status`, `limit` (`1..200`, default `50`) | Exporta la bandeja de anomalías y alertas forenses acotadas al alcance de la llave institucional. |
| `GET` | `/api/integration/reports/summary` | `period` (`ALL`, `30D`, `90D`, `YTD`) | Entrega el Resumen Ejecutivo de Cumplimiento Normativo (KPIs, desglose por tipología y procesos prioritarios). |
| `GET` | `/api/integration/resolutions` | `decision` (`CONFIRMED`, `DISMISSED`), `q`, `page`, `limit` | Exporta el historial auditable de hallazgos ratificados o desestimados con fecha y sustento técnico. |

### 3. Ejemplos de Consumo (`curl`)

```bash
# 1. Consultar anomalías institucionales desde SIGEF / ERP externo
curl -X GET "http://localhost:3001/api/integration/anomalies?status=CONFIRMED&limit=25"   -H "X-Integration-Key: vdia_b2g_a1b2c3d4e5f6_TuSecretoInstitucional"

# 2. Obtener resumen ejecutivo de cumplimiento normativo (Ley 340-06)
curl -X GET "http://localhost:3001/api/integration/reports/summary?period=ALL"   -H "Authorization: Bearer vdia_b2g_a1b2c3d4e5f6_TuSecretoInstitucional"

# 3. Exportar historial de resoluciones y dictámenes de auditoría
curl -X GET "http://localhost:3001/api/integration/resolutions?decision=CONFIRMED&page=1&limit=20"   -H "X-Integration-Key: vdia_b2g_a1b2c3d4e5f6_TuSecretoInstitucional"
```

## Changelog
| Date | Feature | Change |
|------|---------|--------|
| 2026-10-18 | `project-scanner` | Documentación inicial de integración con DGCP API, Redis/arq y Render |

---
_Last updated: 2026-10-20 by implementer (added B2G External Interoperability API & API Keys)_