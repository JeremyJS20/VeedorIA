# 🗺️ VeedorIA — Mapa Completo de Pantallas y Orígenes de Datos

Este documento registra el universo de pantallas definidas para **VeedorIA**, asociando cada interfaz de usuario con su respectivo origen de datos en el backend (Endpoints API, Tablas SQLite y Modelos de IA). Sirve como referencia oficial de arquitectura de información (*site map*) y de integración de datos.

---

## I. Portal Público (CivicTech — Acceso Libre y Gratuito)
Orientado a ciudadanos, periodistas de investigación y ONGs. No requiere sesión activa.

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 1 | Landing Page | `/` | ✅ Diseño completo | Alta | `/api/public/stats` (Métricas globales agregadas) |
| 2 | Buscador Ciudadano | `/public` | ✅ Diseño completo | Alta | `/api/public/search` (Búsqueda sobre tablas `Process` y `Supplier`) |
| 3 | Visualización del Sankey de Gasto | `/public/budget-flow` | ⬜ Pendiente | Media | `/api/public/budget-sankey` (Agrupación de contratos por UOC y RNC) |
| 4 | Comparador Comunitario de Precios | `/public/price-checker` | ⬜ Pendiente | Media | `/api/public/price-comparison` (Relación precio unitario vs índice comercial) |
| 5 | Detalle de Proceso de Compra Público | `/public/process/:id` | ⬜ Pendiente | Media | `/api/public/processes/{id}` (Registro en tabla `Process` y contratos asociados) |
| 6 | Perfil Público de Proveedor | `/public/supplier/:rnc` | ⬜ Pendiente | Baja | `/api/public/suppliers/{rnc}` (Historial de adjudicaciones y flags en tabla `Supplier`) |
| 7 | Perfil Público de Institución | `/public/institution/:id` | ⬜ Pendiente | Baja | `/api/public/institutions/{id}` (Estadísticas y ranking de contratos por ministerio) |
| 8 | Portal de Descarga de Datos Abiertos | `/public/data-downloads` | ⬜ Pendiente | Baja | `/api/public/download` (Exportador CSV/JSON a partir de tablas OCDS) |

---

## II. Módulo de Autenticación y Onboarding
Pantallas de acceso, recuperación de credenciales e integración multi-tenant.

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 9 | Inicio de Sesión | `/login` | ✅ Diseño completo | Alta | `/api/auth/login` (Autenticación contra tabla `User`, retorna tokens JWT) |
| 10 | Registro de Cuentas (Multi-paso) | `/register` | ✅ Diseño completo | Alta | `/api/auth/register` (Escritura en tablas `User`, `Organization` y pasarela Stripe/Azul) |
| 11 | Pasarela de Aceptación de Invitaciones | `/join?code=XYZ` | ✅ Diseño completo | Alta | `/api/auth/join-validate` (Lectura y verificación de `invitation_code` en tabla `Organization`) |
| 12 | Recuperación de Contraseña | `/forgot-password` y `/reset-password` | ✅ Diseño completo | Alta | `/api/auth/forgot-password` y `/api/auth/reset-password` (Valida tokens efímeros en `User`) |

---

## III. Consola B2G: Monitoreo Gubernamental
Acceso exclusivo para auditores de entidades gubernamentales contratantes y organismos de control (licencia gubernamental).

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 13 | Dashboard del Auditor | `/dashboard` | ✅ Diseño completo | Alta | `/api/auditor/dashboard` (Estadísticas globales, alertas críticas y score de integridad) |
| 14 | Bandeja de Investigación de Anomalías | `/dashboard/anomalies` | ✅ Diseño completo | Alta | `/api/auditor/alerts` (Lectura de tabla `Alert` generada por Isolation Forest y Fraccionamiento) |
| 15 | Explorador de Licitaciones Locales | `/dashboard/procurement` | ⬜ Pendiente | Alta | `/api/auditor/processes` (Tabla `Process` filtrada por el `organization_id` de la institución) |
| 16 | Consola Interactiva de Redes de Colusión | `/dashboard/collusion-network` | ⬜ Pendiente | Alta | `/api/auditor/collusion-graph` (Grafo relacional de RPEs con teléfonos/direcciones compartidos) |
| 17 | Configuración de IA y Parámetros del Motor | `/dashboard/ia-config` | ⬜ Pendiente | Media | `/api/admin/ml-config` (Lectura/escritura de umbrales en tabla `SystemConfig`) |
| 18 | Historial de Resoluciones de Alertas | `/dashboard/audit-decisions` | ⬜ Pendiente | Media | `/api/auditor/resolutions` (Historial de justificaciones del equipo en `AlertResolution`) |
| 19 | Generador de Reportes de Cumplimiento | `/dashboard/reports` | ⬜ Pendiente | Media | `/api/auditor/reports/export` (Genera PDFs firmados de auditorías con base en anomalías) |
| 20 | Consola de Integraciones API B2G | `/dashboard/api-integrations` | ⬜ Pendiente | Baja | `/api/auditor/api-keys` (Generación de claves de integración en tabla `ApiKey`) |

---

## IV. Consola B2B: Inteligencia de Licitaciones
Acceso exclusivo para empresas privadas y proveedores inscritos en el RPE (suscripción comercial activa).

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 21 | Dashboard del Oferente | `/dashboard` | ✅ Diseño completo (RBAC) | Alta | `/api/bidder/dashboard` (Licitaciones guardadas, sectores activos y volumen) |
| 22 | Consola de Inteligencia de Mercado | `/dashboard/market-intelligence` | ✅ Diseño completo | Alta | `/api/bidder/market-analysis` (Precios históricos, histogramas y cuotas de mercado por UNSPSC) |
| 23 | Alimentador de Oportunidades Recomendadas | `/dashboard/opportunities` | ⬜ Pendiente | Alta | `/api/bidder/opportunities` (Cruza los UNSPSC de la `Organization` con `Process` activos) |
| 24 | Seguimiento de Licitaciones Propias (Kanban) | `/dashboard/my-bids` | ⬜ Pendiente | Media | `/api/bidder/watchlist` (Gestión de estados del pipeline comercial en tabla `UserWatchlist`) |
| 25 | Ficha de Inteligencia de Competidor | `/dashboard/competitor/:rnc` | ⬜ Pendiente | Media | `/api/bidder/competitors/{rnc}` (Historial de ofertas y precios unitarios del competidor en RPE) |
| 26 | Simulador de Precio Unitario Ganador | `/dashboard/price-simulator` | ⬜ Pendiente | Media | `/api/bidder/simulator` (Inferencia predictiva a partir de la mediana histórica del UNSPSC) |
| 27 | Configuración de Sectores UNSPSC | `/dashboard/sectors` | ⬜ Pendiente | Baja | `/api/bidder/sectors` (Administración de códigos monitoreados de la organización) |

---

## V. Consola de Ajustes (Workspace Settings — Común a B2B y B2G)

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 28 | Ajustes de Organización y Equipo | `/settings/organization` | ✅ Diseño completo | Alta | `/api/organization` (Gestión de miembros y roles sobre tablas `Organization` y `User`) |
| 29 | Suscripción y Facturación | `/settings/billing` | ⬜ Pendiente | Alta | `/api/billing/subscription` (Estado de plan y facturación vía webhook de Stripe/Azul) |
| 30 | Perfil de Usuario | `/settings/profile` | ⬜ Pendiente | Media | `/api/users/me` (Datos personales del usuario autenticado en la tabla `User`) |

---

## VI. Consola de Administrador Global (ADMIN Console)
Acceso exclusivo para el administrador global de la plataforma (NexoDigital).

| # | Nombre de Pantalla | Slug / Ruta | Estado | Prioridad | Fuente de Datos / API Backend |
|---|---|---|---|---|---|
| 31 | Dashboard General de Salud del Sistema | `/admin` | ✅ Diseño completo (RBAC) | Alta | `/api/admin/health` (Métricas de rendimiento, uso de DB, CPU y tasas de error de API) |
| 32 | Consola de Ingestión ETL | `/admin/etl` | ⬜ Pendiente | Alta | `/api/admin/etl/sync` (Trigger y logs del pipeline de extracción de la API de la DGCP) |
| 33 | Control de Modelos de ML Globales | `/admin/ml-models` | ⬜ Pendiente | Alta | `/api/admin/ml/retrain` (Trigger de entrenamiento de Isolation Forest y métricas de precisión) |
| 34 | Administración de Clientes y Licencias | `/admin/organizations` | ⬜ Pendiente | Alta | `/api/admin/organizations` (Gestión, activación y bloqueo de inquilinos en `Organization`) |
| 35 | Lector de Bitácora de Auditoría del Servidor | `/admin/logs` | ⬜ Pendiente | Media | `/api/admin/audit-logs` (Lectura inmutable de registros en tabla `AuditLog`) |
| 36 | Centro de Soporte Técnico | `/admin/support` | ⬜ Pendiente | Baja | `/api/admin/support-tickets` (Gestión de reportes técnicos enviados por usuarios) |

---

## Resumen de Estado

| Estado | Cantidad |
|---|---|
| ✅ Diseño completo (`design.md` creado) | 10 |
| ⬜ Pendiente (por diseñar) | 26 |
| **Total** | **36** |

### Estructura base del Contenedor:
*   [console_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/console_layout.md) (Sidebar y Cabecera de consola centralizados)
*   [public_layout.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/public_layout.md) (Cabecera horizontal y pie de página públicos)

### Pantallas con diseño completo:
1. `landing` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/landing/design.md)
2. `civic_portal` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/civic_portal/design.md)
3. `login` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/login_register/design.md)
4. `register` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/register/design.md)
5. `invitation_gateway` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/invitation_gateway/design.md)
6. `password_recovery` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/password_recovery/design.md)
7. `dashboard` (multi-rol con RBAC) → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/dashboard/design.md)
8. `market_intelligence` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/market_intelligence/design.md)
9. `organization_settings` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/organization_settings/design.md)
10. `anomalies_tray` → [design.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/docs/pages_concept/anomalies_tray/design.md)
