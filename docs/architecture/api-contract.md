<!-- scanner:2026-10-18 -->
# API Contract

> 📋 Generado por `project-scanner` el 2026-10-18 a partir de los routers FastAPI en `app/backend/src/presentation/`.

## Base URL
| Environment | URL |
|-------------|-----|
| DEV (Local Uvicorn) | `http://localhost:3001` |
| DEV (Docker Compose) | `http://localhost:8000` |
| PROD (Render) | `[VERIFY]` URL del servicio `veedoria-api` en Render |

## Endpoints
| Method | Path | Auth | Description | Feature |
|--------|------|------|-------------|---------|
| `GET` | `/` | Public | Redirección automática a la documentación interactiva `/redoc` | core |
| `POST` | `/api/sync/dgcp` | JWT (`PLATFORM_ADMIN`) | Dispara sincronización asíncrona (incremental o completa) con la API de Datos Abiertos DGCP (`202 Accepted`) | sync |
| `GET` | `/api/sync/status` | Public | Retorna el estado de la última sincronización y el historial reciente de `sync_log` (sync y detection) | sync |
| `POST` | `/api/anomalies/detect` | JWT (`DETECTION_RUN`) | Encola una corrida de detección de anomalías en background vía `arq` (`202 Accepted`). `AUDITOR` / `TENANT_ADMIN` / `PLATFORM_ADMIN` | anomalies |
| `GET` | `/api/anomalies` | Public | Lista paginada de anomalías con filtros por `anomaly_type`, `status` y `min_severity` | anomalies |
| `GET` | `/api/anomalies/stats` | Public | Estadísticas agregadas de anomalías por tipo, estado y severidad | anomalies |
| `GET` | `/api/anomalies/{anomaly_id}` | Public | Obtiene el detalle de una anomalía específica por su UUID | anomalies |
| `GET` | `/api/anomalies/{anomaly_id}/context` | Public | Obtiene el contexto enriquecido de la anomalía (precios de mercado, línea de tiempo institucional, enlaces de colusión) | anomalies |
| `PATCH` | `/api/anomalies/{anomaly_id}` | JWT (`ANOMALY_REVIEW`) | Registra la revisión de un auditor (`CONFIRMED` / `DISMISSED`), motivo de descarte y actualiza pesos en `DetectionConfig`. El `reviewer_id` sale del token, no del body | anomalies |
| `GET` | `/api/public/tenders` | Public | Buscador ciudadano multi-token `AND` con ranking de relevancia y filtros | buscador-ciudadano |
| `GET` | `/api/public/tenders/{id}` | Public | Expediente público de contratación, ítems UNSPSC y hallazgos traducidos | buscador-ciudadano |
| `GET` | `/api/public/institutions` | Public | Catálogo de instituciones con conteo de contratos | buscador-ciudadano |
| `GET` | `/api/public/institutions/{id}` | Public | Radiografía pública de una institución del Estado | buscador-ciudadano |
| `GET` | `/api/public/suppliers/{rpe}` | Public | Radiografía pública de un proveedor del Estado | buscador-ciudadano |
| `GET` | `/api/public/budget-overview` | Public | Flujos presupuestarios agregados para el diagrama Sankey y distribución real del gasto por provincia del proveedor | buscador-ciudadano |
| `GET` | `/api/public/provincial-spend` | Public | Gasto adjudicado y alertas agregadas por provincia | buscador-ciudadano |
| `GET` | `/api/public/rankings` | Public | Ranking de instituciones y proveedores por concentración de hallazgos | buscador-ciudadano |
| `GET` | `/api/public/price-comparisons` | Public | Casos destacados de variación de precios frente a la mediana del mercado | buscador-ciudadano |
| `POST` | `/api/auth/login` | Public | Autenticación institucional y emisión de sesión JWT con organización, rol y permisos | autenticacion-rbac |
| `POST` | `/api/auth/logout` | JWT | Cierre de sesión con registro en bitácora | autenticacion-rbac |
| `GET` | `/api/auth/me` | JWT | Perfil del usuario autenticado, organización suscriptora y permisos efectivos | autenticacion-rbac |
| `POST` | `/api/auth/forgot-password` | Public | Emisión de token efímero de recuperación (respuesta uniforme anti-enumeración) | autenticacion-rbac |
| `POST` | `/api/auth/reset-password` | Public | Restablecimiento de contraseña mediante token de un solo uso | autenticacion-rbac |
| `GET` | `/api/auth/roles` | `ROLE_VIEW` | Catálogo de roles y matriz de 13 permisos | autenticacion-rbac |
| `PUT` | `/api/auth/roles/{role_id}/permissions` | `ROLE_ADMIN` | Actualización de permisos asignados a un rol | autenticacion-rbac |
| `GET` | `/api/auth/tenants` | `USER_ADMIN` | Listado de organizaciones suscriptoras (`B2G`, `B2B`, `Global`) | autenticacion-rbac |
| `GET` | `/api/auth/users` | `USER_ADMIN` | Listado de usuarios con filtros por organización, rol, estado y búsqueda | autenticacion-rbac |
| `POST` | `/api/auth/users` | `USER_ADMIN` | Creación de nuevo usuario institucional o empresarial | autenticacion-rbac |
| `PATCH` | `/api/auth/users/{user_id}` | `USER_ADMIN` | Edición de rol, organización o estado (`ACTIVE`/`SUSPENDED`) de un usuario | autenticacion-rbac |
| `PATCH` | `/api/auth/me/profile` | JWT | Autoservicio de actualización de nombre y unidad administrativa | autenticacion-rbac |
| `POST` | `/api/auth/me/password` | JWT | Cambio de contraseña propia validando contraseña actual | autenticacion-rbac |
| `POST` | `/api/auth/demo-switch` | Public (Demo) | Conmutador instantáneo de cuentas multi-organización para demostración | autenticacion-rbac |
| `GET` | `/api/auditor/processes` | JWT (`ANOMALY_READ`) | Explorador paginado de procesos institucionales con KPIs y filtro de hallazgos | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/processes/{process_id}` | JWT (`ANOMALY_READ`) | Detalle interno de expediente (contratos adjudicados y anomalías) para `ProcessInspectorDrawer` | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/collusion-network` | JWT (`ANOMALY_READ`) | Red relacional de proveedores vinculados y co-adjudicaciones (con candado `B2G_BASIC`) | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/detection-config` | JWT (`ANOMALY_READ`) | Lectura de los 13 parámetros en BD (pesos, sensibilidad y 7 topes de modalidad DGCP). Alimenta la vista de consulta `/app/configuracion-deteccion` | herramientas-auditoria-b2g |
| `PUT` | `/api/auditor/detection-config` | JWT (**solo `PLATFORM_ADMIN`**; `can_edit: false` para el resto) | Actualización de pesos y topes de modalidad DGCP con traza en `AuditLog`. Se conserva por compatibilidad de API; la UI ya no escribe aquí (superficie única: `/app/calibracion`) | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/resolutions` | JWT (`ANOMALY_READ`) | Historial paginado de dictámenes emitidos (`CONFIRMED` / `DISMISSED`) con auditor y motivo | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/reports/summary` | JWT (`ANOMALY_READ`) | Consolidado ejecutivo de cumplimiento con matriz legal condicional Ley 340-06 | herramientas-auditoria-b2g |
| `GET` | `/api/auditor/integrations` | JWT (`ANOMALY_READ`) | Listado de llaves de interoperabilidad institucional y endpoints disponibles | herramientas-auditoria-b2g |
| `POST` | `/api/auditor/integrations/keys` | JWT (`PLATFORM_ADMIN`/`TENANT_ADMIN`/`CONTRALOR`) | Emisión de nueva llave API (`vdia_b2g_...`) con hash SHA-256 en `AuditLog` | herramientas-auditoria-b2g |
| `DELETE` | `/api/auditor/integrations/keys/{key_id}` | JWT (`PLATFORM_ADMIN`/`TENANT_ADMIN`/`CONTRALOR`) | Revocación inmediata de credencial de interoperabilidad institucional | herramientas-auditoria-b2g |
| `GET` | `/api/integration/anomalies` | API Key (`vdia_b2g_...`) | Consulta externa ERP/SIGEF de hallazgos acotados al tenant de la llave | herramientas-auditoria-b2g |
| `GET` | `/api/integration/reports/summary` | API Key (`vdia_b2g_...`) | Resumen ejecutivo externo de cumplimiento institucional | herramientas-auditoria-b2g |
| `GET` | `/api/integration/resolutions` | API Key (`vdia_b2g_...`) | Historial externo de resoluciones de auditoría | herramientas-auditoria-b2g |
| `GET` | `/api/b2b/opportunities` | JWT (segmento `B2B_SUPPLIER`/`GOV_OVERSIGHT`/`PLATFORM` o permiso `B2B_ANALYTICS`) | Radar de Oportunidades (#23) con KPIs, filtros por rubro/institución/modalidad y solo alta afinidad | suite-licitaciones-b2b |
| `GET` | `/api/b2b/bids` | JWT (ídem) | Seguimiento de Mis Licitaciones (#24) con KPIs de pipeline y tasas de envío/adjudicación | suite-licitaciones-b2b |
| `POST` / `PUT` / `DELETE` | `/api/b2b/bids[/{bid_id}]` | JWT (ídem) | CRUD del watchlist persistido en `audit_log` (`B2B_WATCHLIST:{tenant}`) con cuota de 10 activos en `B2B_PYME` | suite-licitaciones-b2b |
| `GET` | `/api/b2b/competitors` | JWT (ídem) | Ranking de competidores por historial de contratos con búsqueda por RPE/nombre | suite-licitaciones-b2b |
| `GET` | `/api/b2b/competitors/{rnc}` | JWT (ídem) | Ficha Forense y Comercial de Competidor (#25); inteligencia forense (precios compartidos por rubro + flags de anomalías) bloqueada en `B2B_PYME` | suite-licitaciones-b2b |
| `GET` | `/api/b2b/price-simulator/catalog` | JWT (ídem) | Catálogo de rubros UNSPSC con muestras disponibles para simulación | suite-licitaciones-b2b |
| `POST` | `/api/b2b/price-simulator` | JWT (ídem) | Simulador de Precios de Oferta (#26): cuartiles P25/P50/P75, índice de competitividad, probabilidad de adjudicación y banda de riesgo legal | suite-licitaciones-b2b |
| `GET` / `PUT` | `/api/b2b/sectors` | JWT (ídem) | Explorador de Sectores e Instituciones Compradoras (#27) + actualización de rubros monitoreados (cuota de 3 rubros en `B2B_PYME`) | suite-licitaciones-b2b |
| `GET` | `/api/b2b/subscription` | JWT | Gestión de Plan y Suscripción (#29): uso actual vs. cuotas, catálogo de planes e historial de cambios | suite-licitaciones-b2b |
| `PUT` | `/api/b2b/subscription` | JWT (`TENANT_ADMIN`/`PLATFORM_ADMIN`/`PROVEEDOR`) | Cambio de plan (`B2B_PYME` ↔ `B2B_CORPORATE`) con traza de auditoría `B2B_PLAN_CHANGE` | suite-licitaciones-b2b |
| `GET` | `/api/admin/sync/overview` | JWT (`PLATFORM_ADMIN`) | KPIs de la última corrida, historial de sincronizaciones y de detecciones (#32) | consola-admin-operaciones |
| `POST` | `/api/admin/sync/trigger` | JWT (`PLATFORM_ADMIN`) | Encola una sincronización DGCP aplicando el mutex de unicidad (`202 Accepted`, `409 SYNC_ALREADY_RUNNING`) | consola-admin-operaciones |
| `GET` | `/api/admin/queue/status` | JWT (`PLATFORM_ADMIN`) | Salud degradable de Redis, latido del worker `arq` y profundidad de cola | consola-admin-operaciones |
| `GET` | `/api/admin/detection-config` | JWT (`PLATFORM_ADMIN`) | Lectura de los 13 parámetros del motor con rango, default y `updated_at` (#33) | consola-admin-operaciones |
| `PUT` | `/api/admin/detection-config` | JWT (`PLATFORM_ADMIN`) | Actualización parcial con clamp al rango permitido, reporte de `adjusted` y auditoría `UPDATE_DETECTION_CONFIG` | consola-admin-operaciones |
| `POST` | `/api/admin/detection-config/reset` | JWT (`PLATFORM_ADMIN`) | Restauración de valores por defecto (todas las claves o una lista) con auditoría `DETECTION_CONFIG_RESET` | consola-admin-operaciones |
| `GET` | `/api/admin/calibration/analysis` | JWT (`PLATFORM_ADMIN`) | Calidad del motor sobre dictámenes humanos: TP/FP/FN, precision/recall/F1, rejilla evaluada y umbral recomendado por tipo de anomalía | consola-admin-operaciones |
| `POST` | `/api/admin/calibration/apply` | JWT (`PLATFORM_ADMIN`) | Persiste umbrales de calibración (`price_zscore_threshold`, `price_min_deviation_pct`, `fragmentation_threshold_dop`) con auditoría `CALIBRATION_APPLY` | consola-admin-operaciones |
| `POST` | `/api/admin/detection/run` | JWT (`PLATFORM_ADMIN`) | Re-ejecuta el motor en background (`202 Accepted`, `409 DETECTION_ALREADY_RUNNING`) | consola-admin-operaciones |
| `GET` | `/api/admin/audit-logs` | JWT (`PLATFORM_ADMIN`) | Bitácora paginada con filtros por acción, actor, entidad y rango de fechas (#35) | consola-admin-operaciones |
| `GET` | `/api/admin/audit-logs/export` | JWT (`PLATFORM_ADMIN`) | Exportación `csv`/`json` (máx. 10 000 filas) con cabecera `X-Checksum-SHA256` y auditoría `AUDIT_LOG_EXPORT` | consola-admin-operaciones |
| `GET` | `/api/admin/health/services` | JWT (`PLATFORM_ADMIN`) | Estado de los 6 componentes (API, BD, Redis/worker, última sync, última detección, scheduler) con `status` agregado y `last_transition` del monitor de salud (#36) | consola-admin-operaciones |
| `GET` | `/api/admin/support/tickets` | JWT (`PLATFORM_ADMIN`) | Bandeja de soporte paginada con filtros por estado, categoría y texto | consola-admin-operaciones |
| `GET` | `/api/admin/support/tickets/{ticket_id}` | JWT (`PLATFORM_ADMIN`) | Detalle del ticket con su hilo de mensajes | consola-admin-operaciones |
| `PATCH` | `/api/admin/support/tickets/{ticket_id}` | JWT (`PLATFORM_ADMIN`) | Cambio de estado, asignación y respuesta; reapertura de `CERRADO` auditada como `TICKET_REOPENED` | consola-admin-operaciones |
| `POST` | `/api/support/tickets` | JWT | Autoservicio: alta de ticket por cualquier usuario autenticado (`201 Created`) | consola-admin-operaciones |
| `GET` | `/api/support/tickets` | JWT | Autoservicio: tickets propios del usuario (aislados por `reporter_id`) | consola-admin-operaciones |
| `GET` | `/api/support/tickets/{ticket_id}` | JWT | Autoservicio: detalle de un ticket propio (`403` si pertenece a otro usuario) | consola-admin-operaciones |

### Consola de Administración Global (`/api/admin/*` y `/api/support/*`)

- **Guard**: todos los endpoints `/api/admin/*` exigen `rol.codigo == PLATFORM_ADMIN`; cualquier otro rol recibe `403 FORBIDDEN_*`.
- **Mutex de operaciones**: solo puede existir una sincronización y una detección en estado `running` a la vez.
- **Degradación**: si Redis o el worker `arq` no responden, `GET /api/admin/queue/status` devuelve `redis: "OFFLINE"` / `worker: "DOWN"` y los disparos se rechazan con `503 QUEUE_UNAVAILABLE` sin romper el resto de la consola.
- **Códigos de error propios**: `VALIDATION_ERROR` (422), `SYNC_ALREADY_RUNNING` / `DETECTION_ALREADY_RUNNING` / `TICKET_CLOSED` (409), `FORBIDDEN_*` (403), `QUEUE_UNAVAILABLE` (503).
- **Trazabilidad**: toda acción sensible (sync, detección, calibración, reset, export, tickets) escribe un `AuditLog` con `timestamp` naive-UTC.

### `PATCH /api/anomalies/{anomaly_id}`
- **Auth**: JWT con permiso `ANOMALY_REVIEW`. El revisor que queda registrado es el del token; el body no lo acepta.
- **Request (`AnomalyReviewPayload`)**:
  ```json
  {
    "status": "CONFIRMED",
    "notes": "Sobreprecio verificado frente a histórico UNSPSC",
    "dismissal_reason": null
  }
  ```
- **Response `200` (`ApiResponse[AnomalyResponse]`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "anomaly_type": "PRICE_ANOMALY",
      "severity": 0.85,
      "confidence": "ALTA",
      "status": "CONFIRMED"
    },
    "message": null
  }
  ```

### `POST /api/b2b/price-simulator` (Simulador de Precios Competitivos — #26)
- **Request**:
  ```json
  { "unspsc_family": "7214", "proposed_unit_price_dop": 1900.0, "quantity": 100, "institution_id": null }
  ```
- **Distribución de mercado** (muestra hasta 300 contratos del rubro, orden desc. por fecha):
  $$\text{P25}, \text{P50 (Mediana)}, \text{P75} = \text{percentiles}_{[0.25,\ 0.50,\ 0.75]}\ (P_1..P_n)$$
- **Desviación vs. mediana**: $\text{delta\%} = \frac{P_\text{oferta} - P_{50}}{P_{50}} \times 100$
- **Bandas de riesgo y pronóstico** (con asesoría legal citando Ley 340-06 / Decreto 416-23 Arts. 96–97):

| Banda | Condición | Índice de competitividad | Prob. adjudicación |
|-------|-----------|--------------------------|--------------------|
| `BAJA_TEMERARIA` | $P_\text{oferta} < 0.70 \times P_{25}$ | 15–45 | 8–32 % |
| `OPTIMA_COMPETITIVA` | $0.70 \cdot P_{25} \le P_\text{oferta} \le P_{50}$ | 82–96 | 74–88.5 % |
| `ZONA_MEDIA_MERCADO` | $P_{50} < P_\text{oferta} \le P_{75}$ | 50–78 | 38–68 % |
| `RIESGO_SOBREPRECIO` | $P_\text{oferta} > P_{75}$ | 10–48 | 5–34 % |

### Candados de plan en `/api/b2b/*` (REQ-002, REQ-003, REQ-005, REQ-006)
- **Cuota rubros monitoreados**: `B2B_PYME` = 3 / `B2B_CORPORATE` = ilimitado (`403 PLAN_QUOTA_EXCEEDED`).
- **Cuota licitaciones activas**: `B2B_PYME` = 10 / `B2B_CORPORATE` = ilimitado.
- **Inteligencia forense de competidor**: bloqueada (`locked: true`) en `B2B_PYME`; en `B2B_CORPORATE` expone precios medianos por rubro UNSPSC del competidor vs. mediana del mercado (`price_delta_pct`) y flags de anomalías del RNC.
- **Los WATCHLIST de seguimiento y el cambio de rubros se persisten de forma inmutable en `audit_log`** (`entity_type = B2B_WATCHLIST:{tenant}` / `B2B_SECTORS:{tenant}` / `B2B_SUBSCRIPTION:{tenant}`).

## Authentication
- **Método configurado**: JWT (`PyJWT` `^2.9.0`) + hashing de contraseñas con `bcrypt` `^4.2.0`.
- **Algoritmo**: `HS256` (`JWT_ALGORITHM` en `app/backend/src/config.py`).
- **Estado actual**: Configuración y modelo `User` / `UserRole` presentes; protección de rutas mediante middleware/dependencias JWT en proceso de integración para los portales autenticados.

## Error Format
Todas las respuestas de error utilizan el esquema estándar `ApiErrorResponse` (`app/backend/src/domain/types.py`):
```json
{
  "success": false,
  "error": "Descripción legible del error",
  "details": []
}
```

| HTTP Status | Handler | Descripción |
|-------------|---------|-------------|
| `400` | `AppError` (`app_error_handler`) | Error de negocio o parámetros inválidos |
| `404` | `NotFoundError` (`app_error_handler`) | Recurso no encontrado |
| `422` | FastAPI / Pydantic | Error de validación de esquema en query/body |
| `500` | `global_exception_handler` | Error interno no controlado (`Error interno del servidor`) |

## Versionamiento
- **Estrategia actual**: Prefijo global `/api` en `app/backend/src/presentation/main.py` (`app.include_router(..., prefix="/api")`).
- **Documentación OpenAPI**: Generada automáticamente por FastAPI en `/docs` (Swagger UI) y `/redoc` (ReDoc).

## Rate Limiting
| Dirección | Límite | Configuración |
|-----------|--------|---------------|
| Saliente hacia API DGCP (`DGCPClient`) | `5.0` req/s (configurable vía `SYNC_RATE_LIMIT`) | Controlado en `DGCPClient` + query param `rate_limit` en `POST /api/sync/dgcp` |
| Entrante a VeedorIA API | `[VERIFY]` Sin límite configurado en aplicación | Delegado a proxy inverso / plataforma de despliegue |

## Paginación
Estrategia: **Paginación basada en página (`page` y `limit`)** en `GET /api/anomalies`.

**Request**:
```http
GET /api/anomalies?anomaly_type=PRICE_ANOMALY&status=PENDING&page=1&limit=50
```

**Response (`ApiResponse[AnomalyListResponse]`)**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 120,
    "page": 1,
    "limit": 50
  },
  "message": null
}
```
- `page`: Índice base 1 (`ge=1`, default `1`).
- `limit`: Cantidad de registros por página (`ge=1`, `le=200`, default `50`).

## Ejemplo curl
```bash
# Consultar estado de sincronización y detección
curl -X GET http://localhost:3001/api/sync/status

# Listar anomalías pendientes con severidad >= 0.7
curl -X GET "http://localhost:3001/api/anomalies?status=PENDING&min_severity=0.7&page=1&limit=20"

# Disparar detección de anomalías en segundo plano
curl -X POST http://localhost:3001/api/anomalies/detect
```

## Changelog
| Date | Feature | Change |
|------|---------|--------|
| 2026-10-18 | `project-scanner` | Contrato inicial extraído de `main.py`, `routers/anomaly.py` y `routers/sync.py` |
| 2026-10-21 | `implementer` (Paquete 3) | Añadidos los 11 endpoints de la Suite de Licitaciones B2B (`/api/b2b/*`, REQ-001..REQ-006), bandas del Simulador de Precios y candados de plan `B2B_PYME`/`B2B_CORPORATE` |
| 2026-10-21 | `implementer` (Paquete 4) | Añadidos los 15 endpoints `/api/admin/*` y los 3 de autoservicio `/api/support/tickets`; `PUT /api/auditor/detection-config` pasa a ser exclusivo de `PLATFORM_ADMIN` |

---
_Last updated: 2026-10-21 by implementer (added consola-admin-operaciones /api/admin/* + /api/support/* endpoints)_