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
| `POST` | `/api/sync/dgcp` | `[VERIFY]` Public / Internal | Dispara sincronización asíncrona (incremental o completa) con la API de Datos Abiertos DGCP (`202 Accepted`) | sync |
| `GET` | `/api/sync/status` | Public | Retorna el estado de la última sincronización y el historial reciente de `sync_log` (sync y detection) | sync |
| `POST` | `/api/anomalies/detect` | `[VERIFY]` Public / Internal | Encola una corrida de detección de anomalías en background vía `arq` (`202 Accepted`) | anomalies |
| `GET` | `/api/anomalies` | Public | Lista paginada de anomalías con filtros por `anomaly_type`, `status` y `min_severity` | anomalies |
| `GET` | `/api/anomalies/stats` | Public | Estadísticas agregadas de anomalías por tipo, estado y severidad | anomalies |
| `GET` | `/api/anomalies/{anomaly_id}` | Public | Obtiene el detalle de una anomalía específica por su UUID | anomalies |
| `GET` | `/api/anomalies/{anomaly_id}/context` | Public | Obtiene el contexto enriquecido de la anomalía (precios de mercado, línea de tiempo institucional, enlaces de colusión) | anomalies |
| `PATCH` | `/api/anomalies/{anomaly_id}` | `anomalies:review` | Registra la revisión de un auditor (`CONFIRMED` / `DISMISSED`), motivo de descarte y actualiza pesos en `DetectionConfig` | anomalies |
| `GET` | `/api/public/tenders` | Public | Buscador ciudadano multi-token `AND` con ranking de relevancia y filtros | buscador-ciudadano |
| `GET` | `/api/public/tenders/{id}` | Public | Expediente público de contratación, ítems UNSPSC y hallazgos traducidos | buscador-ciudadano |
| `GET` | `/api/public/institutions` | Public | Catálogo de instituciones con conteo de contratos | buscador-ciudadano |
| `GET` | `/api/public/institutions/{id}` | Public | Radiografía pública de una institución del Estado | buscador-ciudadano |
| `GET` | `/api/public/suppliers/{rpe}` | Public | Radiografía pública de un proveedor del Estado | buscador-ciudadano |
| `GET` | `/api/public/budget-overview` | Public | Flujos presupuestarios agregados para el diagrama Sankey | buscador-ciudadano |
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

### `PATCH /api/anomalies/{anomaly_id}`
- **Request (`AnomalyReviewPayload`)**:
  ```json
  {
    "reviewer_id": "uuid-auditor",
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

---
_Last updated: 2026-10-19 by solution-designer (added /api/public/* and /api/auth/*)_