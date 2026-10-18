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
| `PATCH` | `/api/anomalies/{anomaly_id}` | `[VERIFY]` Auditor | Registra la revisión de un auditor (`CONFIRMED` / `DISMISSED`), motivo de descarte y actualiza pesos en `DetectionConfig` | anomalies |

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
_Last updated: 2026-10-18 by project-scanner_