# 🇩🇴 VeedorIA — Plan de Implementación Exhaustivo

## Descripción General del Proyecto

**VeedorIA** es un sistema inteligente de monitoreo de contrataciones públicas de la República Dominicana. Su propósito es consumir datos abiertos del portal de la Dirección General de Contrataciones Públicas (DGCP), almacenarlos localmente, y aplicar algoritmos de aprendizaje automático y análisis relacional para detectar anomalías de precios, fraccionamientos sospechosos y redes de colusión entre proveedores.

El proyecto se construye como un **portafolio personal** de ingeniería de software, demostrando competencias en desarrollo full-stack, ciencia de datos aplicada, diseño de interfaces institucionales y arquitectura limpia. No está sujeto a evaluación académica, lo cual otorga libertad para priorizar calidad técnica y estética sobre plazos rígidos.

### Stack Tecnológico Completo

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 19, Vite, TypeScript | Ecosistema moderno con HMR ultra-rápido y tipado estático |
| UI Components | HeroUI (antes NextUI) | Componentes accesibles con soporte nativo de temas |
| Estilos | TailwindCSS 4 | Utilidades atómicas con soporte CSS nativo |
| Internacionalización | i18next + react-i18next | Soporte bilingüe ES/EN con formateo de moneda DOP |
| Grafos Visuales | D3.js (force layout) | Simulación de fuerzas físicas para redes de colusión |
| Backend | Python 3.11+, FastAPI | Framework asíncrono de alto rendimiento con tipado nativo |
| ORM / DB Layer | SQLModel + SQLAlchemy 2.0 | Combina Pydantic con SQLAlchemy 2.0. Migraciones con Alembic |
| Base de Datos (dev) | SQLite 3 | Cero configuración, archivo local portátil |
| Base de Datos (prod) | PostgreSQL vía Supabase | Migración directa de tablas relacionales mediante Alembic |
| ML / Análisis | scikit-learn, NetworkX, python-Levenshtein | Detección de anomalías, grafos relacionales y fuzzy matching |
| Auth | PyJWT + bcrypt (directo) | Generación de JWT y hashing seguro directo con bcrypt sin passlib |
| Testing | Pytest + httpx (async) | Testing asíncrono con bases de datos en memoria para test |
| Linter/Formatter | Ruff | Reemplazo unificado de flake8, isort y black |
| Deploy Frontend | Vercel | CDN global con rewrites de proxy para CORS |
| Deploy Backend | Render | Contenedor Python con auto-deploy desde Git |

---

## Alineación con las Guías Locales del Repositorio

Cada fase del plan se desarrolla en estricta conformidad con las **21 guías de reglas locales** almacenadas en `veedoria-monorepo/.agents/rules/`. Estas guías no son documentación pasiva; son instrucciones operativas que cualquier agente de IA (Gemini, Cursor, Copilot) debe leer automáticamente antes de generar o modificar código en el proyecto. La orquestación se logra a través de los archivos raíz `GEMINI.md`, `AGENTS.md`, `.cursorrules` y `.gemini/rules/README.md`, que apuntan a las reglas relevantes.

### Guías de Diseño Institucional ("Digital Institution")

*   **Manual Central**: [INSTITUTIONAL_DESIGN.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/INSTITUTIONAL_DESIGN.md) — Define la filosofía visual completa: paleta Navy/Cyan/Teal, regla "No-Line" (cero bordes visibles, solo sombras y tonos de fondo), glassmorphism con capas de desenfoque gaussiano, y microanimaciones de entrada escalonada.
*   [Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part01-visual-theme-atmosphere-to-inputs-forms.md): Temas, atmósfera visual, efectos de resplandor ambiental, y formularios con campos translúcidos de foco suave.
*   [Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part02-status-icons-to-tooltips.md): Iconos de estado semánticos (Lucide), Trust Meters de progreso gradual, y tooltips con micro-delay.
*   [Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part03-alerts-banners-to-contrast-ratios.md): Banners de alerta por severidad (info/warning/error/critical), toasts temporales, y ratios de contraste WCAG AA.
*   [Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part04-focus-indicators-to-loading-states.md): Indicadores de foco accesibles, spinners de doble anillo institucional, y estados skeleton con barras shimmer.
*   [Parte 5](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part05-full-page-loading-to-2-the-theme-block.md): Sistema de doble tema (Dark/Light) con toggler Moon/Sun, persistencia en localStorage, y transición CSS suave de 200ms.
*   [Parte 6](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part06-3-resulting-utility-classes-to-6-file-organization.md): Clases de utilidad institucionales, márgenes asimétricos, y organización de archivos CSS del monorepo.

### Guías de Arquitectura Frontend (React + Vite + TypeScript)

*   **Manual Central**: [REACT_VITE_TS_ARCHITECTURE.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/REACT_VITE_TS_ARCHITECTURE.md) — Filosofía feature-based, separación Domain/Infrastructure/Presentation, y convenciones de naming.
*   [Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part01-philosophy-to-app-with-lazy-routes.md): Scaffolding del monorepo, dependencias iniciales, configuración de React Router 7 con lazy loading de rutas.
*   [Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part02-data-fetching-hooks-to-react-performance.md): Hooks personalizados `useFetch`/`useMutation` para peticiones API, manejo de cache local, y técnicas de control de re-renders con `useMemo`/`useCallback`/`React.memo`.
*   [Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part03-preloading-critical-routes-to-file-structure.md): Preloading de chunks críticos en hover de navegación, code-splitting granular, y estructura de directorios por feature.
*   [Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part04-configuration-to-i18n-conventions.md): Configuración de i18next con namespaces por feature, formateadores de moneda dominicana (DOP) y fecha local (es-DO), y convenciones de claves de traducción.

### Guías de Arquitectura Backend (Python + FastAPI)

*   **Manual Central**: [PYTHON_FASTAPI_ARCHITECTURE.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/PYTHON_FASTAPI_ARCHITECTURE.md) — Clean Architecture en 4 capas (Domain → Services → Infrastructure → Presentation), convenciones de módulos y naming Python.
*   [Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part01-philosophy-to-configuration-files.md): Filosofía de modularidad, configuración mediante Pydantic Settings con validación de tipos, y patrón lifespan de FastAPI para inicialización/cierre de recursos.
*   [Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part02-database-layer-prisma-orm-to-lifecycle.md): Capa de base de datos con SQLModel y sesiones asíncronas, y ruta de migración SQLite→PostgreSQL con Alembic.
*   [Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part03-domain-layer-pydantic-validation-to-custom-validators.md): Capa de dominio con SQLModel y validación Pydantic estricta, constraints de campo y validadores cruzados.
*   [Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part04-server-utilities-to-envelope-responses.md): Respuestas de servidor unificadas, esquema `ApiResponse[T]` y control global de excepciones con `AppError`.
*   [Parte 5](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part05-fastapi-routers-controllers-to-dependency-injection.md): Routers REST con `APIRouter`, controladores y patrones de Inyección de Dependencias.
*   [Parte 6](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part06-security-hardening-cors-to-jwt-auth.md): Hardening de seguridad con CORS, hashing de contraseñas directo con bcrypt y autenticación JWT con PyJWT.
*   [Parte 7](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part07-performance-concurrency-to-ml-offloading.md): Concurrencia y offloading de ML — ejecución de tareas CPU-intensivas (Isolation Forest, NetworkX) dentro de un `ProcessPoolExecutor` para no bloquear el event loop de FastAPI.
*   [Parte 8](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part08-unit-testing-pytest-to-mocking.md): Testing con Pytest, fixtures asíncronas, base de datos de test en memoria, y testing de integración de endpoints con `httpx.AsyncClient`.

### Directrices de Negocio

*   [modelo_negocio_veedoria.md](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/modelo_negocio_veedoria.md): Define los tres flujos comerciales — suscripción B2G para instituciones gubernamentales, suscripción B2B para firmas auditoras, y portal gratuito CivicTech para ciudadanos y periodistas.

---

## Decisiones Técnicas y de Negocio Consolidadas

> [!IMPORTANT]
> ### Resoluciones de Arquitectura e Ingestión
>
> 1. **Modelado en la base del backend:** Los modelos de base de datos vivirán directamente en el backend (`backend/app/models/`) utilizando **SQLModel**. No habrá una carpeta `prisma/` en la raíz del monorepo, ya que las definiciones de tablas se manejan directamente en Python. Las migraciones se gestionarán mediante **Alembic** dentro de la carpeta `backend/migrations/`.
>
> 2. **Autenticación JWT local sin Supabase Auth:** En las fases iniciales, la autenticación se manejará completamente en el backend FastAPI mediante tokens JWT firmados con HMAC-SHA256 usando **PyJWT**. Las contraseñas se hashearán directamente con la librería **bcrypt** (costo 12). Las sesiones se almacenarán en SQLite. Esto evita la dependencia de Supabase Auth durante el desarrollo local, pero el esquema de la tabla `User` se diseñará con campos compatibles (UUID como identificador primario, campos de metadata JSON) para facilitar una migración futura directa.
>
> 3. **Ejecución de ML en procesos separados:** Todas las operaciones de scikit-learn y NetworkX se ejecutarán en un `ProcessPoolExecutor` dedicado, invocado desde los servicios de FastAPI mediante `asyncio.run_in_executor`. Esto significa que el motor de ML nunca bloqueará las respuestas HTTP del servidor, pero implica que los resultados de análisis no estarán disponibles de forma síncrona.
>
> 4. **Estrategia de Ingestión Manual (CLI):** Se implementará un **script CLI de ingestión manual** en lugar de descargas automáticas al iniciar el backend. Esto previene bloqueos accidentales en SQLite debido a escrituras concurrentes durante iteraciones rápidas de desarrollo y permite la descarga determinista de lotes bajo demanda mediante argumentos de fechas.
>
> 5. **Alcance del Dataset Acotado:** La semilla de base de datos se limitará a un subconjunto híbrido: los procesos de contratación del **Ministerio de Educación (MINERD)**, **Ministerio de Obras Públicas (MOPC)** y **Servicio Nacional de Salud (SNS)**, filtrados exclusivamente por las categorías UNSPSC de **Tecnología (laptops, servidores)**, **Construcción (asfalto, cemento)** y **Suministros Médicos (jeringas, medicamentos)**. Esto asegura una alta densidad de ítems similares para entrenar de manera efectiva el Isolation Forest.
>
> 6. **Portal Ciudadano Diferenciado (CivicTech):** El portal gratuito ciudadano no será una réplica de solo lectura del dashboard de auditoría. Se diseñará una **experiencia cívica diferenciada e interactiva** accesible sin login en la ruta `/public`. Contará con un motor de búsqueda simple en lenguaje natural ("¿Cuánto gastó mi provincia?"), visualizaciones sencillas de flujos (Sankey, Mapa) y un comparador de precios comunitario que contrasta los precios unitarios estatales contra precios del sector detallista/comercial.

---

## Estructura del Monorepo

El monorepo se organiza en tres directorios raíz que separan responsabilidades de forma clara:

*   **`database/`** — Almacena el archivo SQLite generado (`veedoria.db`). Este directorio está incluido en `.gitignore` porque la base de datos local es un artefacto efímero que se recrea a partir de las migraciones de Alembic. En producción, este directorio no existirá porque la conexión apuntará a PostgreSQL remoto.

*   **`frontend/`** — Aplicación React completa inicializada con Vite y plantilla TypeScript. Internamente sigue una estructura feature-based con separación en capas Domain (tipos e interfaces), Infrastructure (hooks de API, servicios HTTP), Presentation (componentes, páginas, layouts) y Validation (esquemas Zod de formularios).

*   **`backend/`** — Servidor FastAPI con arquitectura Clean en 4 capas: Domain (modelos SQLModel y esquemas Pydantic), Services (lógica de negocio y ML), Infrastructure (clientes de API externa, bases de datos, repositorios), y Presentation (routers y controladores). Contiene la carpeta `migrations/` gestionada por **Alembic** para el control de versiones de base de datos. Gestionado con Poetry para dependencias Python.

---

## Fase 0: Infraestructura, Scaffolding y Esquema de Datos

**Objetivo:** Establecer un entorno de desarrollo completamente funcional donde tanto el frontend como el backend puedan ejecutarse simultáneamente, comunicarse entre sí a través de un proxy, y compartir un esquema de base de datos relacional generado automáticamente.

**Duración estimada:** Semana 1

---

### 0.1 — Inicialización del Frontend (React + Vite + TypeScript)

Se creará el proyecto React dentro del directorio `frontend/` utilizando el scaffolder de Vite con la plantilla TypeScript estricta. Inmediatamente después de la creación, se instalarán las dependencias del ecosistema divididas en tres grupos:

**Dependencias de runtime:** React Router 7 (para enrutamiento declarativo con lazy loading), HeroUI junto con su proveedor de tema y Framer Motion (requerido por HeroUI para animaciones de transición entre estados de componentes), i18next con su adaptador React y el plugin de detección de idioma del navegador, y Axios como cliente HTTP con interceptores configurables.

**Dependencias de desarrollo:** TailwindCSS 4 con su plugin de Vite (que reemplaza PostCSS en la versión 4), los tipos de React y Node para TypeScript, y ESLint con la configuración recomendada de React.

**Configuración del proxy de desarrollo:** Se configurará el servidor de desarrollo de Vite para que cualquier petición HTTP que comience con el prefijo `/api` sea redirigida automáticamente al puerto 3001 donde corre FastAPI. Esto elimina problemas de CORS durante el desarrollo local y simula la arquitectura de producción donde Vercel hará lo mismo mediante rewrites.

**Configuración de alias de imports:** Se definirán alias de ruta en la configuración de Vite y en el archivo de configuración de TypeScript para que los imports internos usen prefijos descriptivos (por ejemplo, `@/components`, `@/hooks`, `@/services`) en lugar de rutas relativas profundas con múltiples niveles de directorios padre.

**Estructura inicial de directorios del frontend:** Se crearán los directorios vacíos que reflejan la arquitectura feature-based descrita en las guías de React. La carpeta `src/` contendrá subcarpetas para `domain/` (tipos TypeScript e interfaces de contrato), `infrastructure/` (instancia de Axios configurada, hooks genéricos de fetching), `presentation/` (dividida en `components/`, `layouts/`, `pages/`), `validation/` (esquemas Zod para formularios), y `i18n/` (archivos JSON de traducciones por namespace).

#### Guías Aplicables
*   [React Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part01-philosophy-to-app-with-lazy-routes.md): Filosofía, scaffolding y configuración de lazy routes
*   [React Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part04-configuration-to-i18n-conventions.md): Configuración de i18next y convenciones de localización

---

### 0.2 — Inicialización del Backend (Python + FastAPI + Poetry)

Se inicializará un proyecto Poetry dentro del directorio `backend/` que gestionará todas las dependencias Python en un entorno virtual aislado. El archivo `pyproject.toml` definirá la versión mínima de Python como 3.11 (requerida para las mejoras de tipado y `ExceptionGroup`).

**Dependencias principales:** FastAPI como framework web, Uvicorn como servidor ASGI con workers configurables, SQLModel y SQLAlchemy 2.0 para la comunicación y modelado relacional asíncrono con SQLite, Alembic para la gestión de migraciones, httpx como cliente HTTP asíncrono (para la ingestión de datos de la DGCP), Pydantic Settings para la carga validada de variables de entorno, PyJWT para la generación y verificación de tokens JWT, bcrypt (librería nativa directa) para hashing de contraseñas, scikit-learn para el motor Isolation Forest, NetworkX para la construcción de grafos de colusión, y python-Levenshtein para el emparejamiento borroso de nombres.

**Dependencias de desarrollo:** Pytest con el plugin anyio para testing asíncrono, httpx (también usado como cliente de test para FastAPI), Ruff como linter y formateador unificado (reemplazando flake8, isort y black en un solo binario de alto rendimiento).

**Configuración del módulo de settings:** Se creará una clase de configuración que hereda de `BaseSettings` de Pydantic. Esta clase leerá automáticamente un archivo `.env` en la raíz del backend y validará que todas las variables requeridas estén presentes con los tipos correctos. Las variables incluirán: la ruta relativa al archivo SQLite (apuntando a `../database/veedoria.db`), la clave secreta para firma JWT, la URL base de la API DGCP, el nivel de logging, y flags booleanos para habilitar/deshabilitar módulos opcionales como el análisis ML.

**Estructura inicial de directorios del backend:** Se crearán los módulos Python que reflejan la Clean Architecture de 4 capas. El paquete principal (`app/`) contendrá subcarpetas para `models/` (clases de SQLModel que actúan tanto de esquema de API como de tabla), `services/` (clases de lógica de negocio pura y ML), `infrastructure/` (repositorios que encapsulan consultas SQLModel con sesiones asíncronas, clientes HTTP para APIs externas), y `presentation/` (routers FastAPI con controladores delgados). Adicionalmente, se creará un módulo `core/` para configuración, excepciones personalizadas, middlewares y el esquema envolvente `ApiResponse`.

**Patrón Lifespan de FastAPI:** El punto de entrada de la aplicación utilizará el patrón lifespan de FastAPI (context manager asíncrono) para ejecutar lógica de inicialización al arrancar el servidor (crear el motor de base de datos asíncrono de SQLModel y el pool de conexiones, inicializar el pool de procesos para ML) y lógica de limpieza al detener el servidor (cerrar conexiones de base de datos, liberar recursos del executor). Esto garantiza un ciclo de vida predecible y libre de fugas de recursos.

### 0.3 — Modelos de Datos Relacionales (SQLModel)

Los modelos de base de datos se definirán utilizando clases de **SQLModel** en el directorio `backend/app/models/`. Al heredar de `SQLModel`, cada clase actuará como modelo de base de datos (definiendo la tabla física y relaciones) y como esquema Pydantic para validación y serialización de datos de la API. Se usará SQLite como motor de desarrollo, garantizando compatibilidad de tipos con PostgreSQL.

**Modelo `User` (Tabla física `user`):** Almacena perfiles y credenciales. Identificador primario UUID v4 generado en la aplicación. Campos: email (único, indexado), hash de contraseña (bcrypt directo), nombre completo, rol (string de un enum: ADMIN, AUDITOR, BIDDER, CITIZEN), fecha de creación, fecha de actualización, y metadata en formato JSON.

**Modelo `Institution` (Tabla física `institution`):** Cataloga entidades del gobierno. Campos: identificador DGCP (clave única), nombre oficial, siglas, sector, y contadores acumulados de procesos y montos para acelerar consultas.

**Modelo `Process` (Tabla física `process`):** Representa procesos de compra. Campos: identificador OCDS (clave única), código interno DGCP, título de compra, método de contratación, estado del proceso, monto estimado presupuestado, moneda (DOP), fecha de publicación, fecha límite, y relación de clave foránea con `Institution`.

**Modelo `Contract` (Tabla física `contract`):** Contratos resultantes de procesos. Relación muchos-a-uno con `Process`. Campos: identificador del contrato, monto adjudicado, RNC del proveedor ganador, fecha de firma, fechas de vigencia, y estado del contrato.

**Modelo `Item` (Tabla física `item`):** Ítems individuales comprados. Relación muchos-a-uno con `Contract`. Campos: descripción, cantidad, unidad, precio unitario, monto total, código UNSPSC, y relación foránea con `Contract`.

**Modelo `Supplier` (Tabla física `supplier`):** Información normalizada de proveedores. Campos: RNC/Cédula (identificador único), nombre registrado, nombre comercial, teléfono, email, dirección, y datos adicionales JSON.

**Modelo `Anomaly` (Tabla física `anomaly`):** Alertas de riesgo. Relación con `Process` o `Contract`. Campos: tipo de anomalía, severidad (float de 0.0 a 1.0), puntaje del algoritmo, explicación en texto legible, estado de revisión (PENDING, CONFIRMED, DISMISSED), auditor que revisa, y timestamps.

**Modelo `AuditLog` (Tabla física `audit_log`):** Bitácora inmutable. Campos: tipo de acción, usuario ejecutor, entidad afectada, valor anterior (JSON), valor nuevo (JSON), IP y timestamp.

**Migraciones de base de datos con Alembic:** Para inicializar y modificar la base de datos se utilizará Alembic. Se creará una revisión inicial (`alembic revision --autogenerate -m "Initial schema"`) para generar el script de migración en base a las clases SQLModel registradas, y se ejecutará (`alembic upgrade head`) para levantar la base SQLite en la carpeta `/database/`.

#### Guías Aplicables
*   [Python Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part02-database-layer-prisma-orm-to-lifecycle.md): SQLModel y base de datos asíncrona
*   [Python Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part03-domain-layer-pydantic-validation-to-custom-validators.md): Modelos de SQLModel y validadores Pydantic

---

### 0.4 — Configuración de Calidad de Código y Herramientas de Desarrollo

**Ruff (Backend):** Se configurará en `pyproject.toml` con un conjunto estricto de reglas activadas que cubren: imports no utilizados, variables sin usar, complejidad ciclomática excesiva, convenciones de naming (snake_case para funciones y variables, PascalCase para clases), ordenamiento de imports por sección (stdlib, third-party, local), y formateo con ancho máximo de línea de 100 caracteres.

**ESLint + TypeScript (Frontend):** Se configurará ESLint con el preset recomendado para React y TypeScript, añadiendo reglas para prevenir hooks mal ordenados, dependencias faltantes en arrays de dependencias de `useEffect`, y uso de `any` explícito.

**Archivo `.env.example`:** Se creará un archivo de ejemplo documentado que liste todas las variables de entorno requeridas con valores placeholder y comentarios explicativos, para que cualquier desarrollador (o agente de IA) pueda configurar el entorno rápidamente.

**Archivo `.gitignore` unificado:** Un solo `.gitignore` en la raíz del monorepo que ignore: `database/*.db` (archivos SQLite), `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, archivos `.env` reales (no el `.example`), e histórico local de Alembic y logs de ejecución de Python.

---

## Fase 1: Sistema de Diseño Institucional y Landing Page

**Objetivo:** Materializar la identidad visual "Digital Institution" como un sistema de diseño reutilizable, y construir una Landing Page de impacto que presente el proyecto y sus capacidades al visitante.

**Duración estimada:** Semana 2

---

### 1.1 — Sistema de Diseño: Variables y Tokens CSS

Se creará el archivo CSS principal (`index.css`) que declare todas las custom properties (variables CSS) del sistema de diseño. Estas variables son la fuente única de verdad para colores, espaciados, radios de borde, sombras y duraciones de animación en toda la aplicación.

**Paleta de colores en HSL:** Todos los colores se definirán en formato HSL (Hue, Saturation, Lightness) para permitir ajustes programáticos de luminosidad y saturación. La paleta base del tema oscuro incluirá: un Navy profundo como fondo principal (aproximadamente HSL 220°, 45%, 15%), un Navy medio para superficies elevadas (HSL 220°, 40%, 20%), un Cyan vibrante como acento primario de interacción (HSL 190°, 90%, 55%), un Teal para acentos secundarios y gráficos (HSL 170°, 70%, 45%), un Esmeralda para indicadores de éxito (HSL 145°, 65%, 45%), un Ámbar para advertencias (HSL 40°, 95%, 55%), un Coral para errores y alertas críticas (HSL 0°, 80%, 60%), y una escala de grises neutros con tinte azulado para textos y bordes sutiles.

**Paleta del tema claro:** Se definirá un segundo bloque de variables bajo el atributo de tema claro en el HTML raíz. La transformación invertirá las luminosidades: fondos blancos con tinte gris azulado suave (HSL 220°, 20%, 97%), superficies blancas puras para tarjetas, y textos oscuros Navy. Los colores de acento (Cyan, Teal) se oscurecerán ligeramente para mantener contraste WCAG AA sobre fondos claros.

**Tokens de glassmorphism:** Se definirán variables para los efectos de vidrio esmerilado institucional: radio de desenfoque gaussiano del fondo (backdrop-blur), opacidad base de la superficie de vidrio (diferente entre temas), color del borde sutil de vidrio (un blanco al 10% de opacidad en oscuro, un gris al 5% en claro), y sombra de elevación con tinte coloreado.

**Tokens de animación:** Duraciones estandarizadas (rápida de 150ms para hover, media de 250ms para transiciones de componentes, lenta de 400ms para entradas de página), funciones de temporización (una curva elástica personalizada para bounce sutil, ease-out para salidas, ease-in-out para transiciones de tema), y delays escalonados para animaciones de entrada en cascada (cada elemento consecutivo aparece con un incremento fijo de delay).

**Tokens de tipografía:** La fuente principal será Inter (cargada desde Google Fonts con pesos 400, 500, 600 y 700). Se definirán tamaños para encabezados (desde H1 grande hasta H6 pequeño), cuerpo de texto, texto pequeño y texto de caption, todos usando unidades `rem` para responder al tamaño base del navegador.

**Tokens de espaciado:** Una escala de 8 puntos (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px) aplicada consistentemente a márgenes, paddings y gaps de grid.

---

### 1.2 — Sistema de Diseño: Componentes Atómicos CSS

Se definirán clases de utilidad reutilizables que encapsulen los patrones visuales más comunes:

**Clase de superficie de vidrio:** Aplica el combo completo de glassmorphism — fondo semitransparente con el color de superficie del tema actual, desenfoque gaussiano del fondo, borde sutil semitransparente (nunca un borde sólido opaco, respetando la regla "No-Line"), y sombra de elevación tintada. Esta clase se usará en todas las tarjetas, paneles laterales, modales y dropdowns del sistema.

**Clase de animación de entrada escalonada:** Define una animación que combina un desplazamiento vertical descendente de 20px con un fade de opacidad de 0 a 1. La versión escalonada aplica un delay incremental calculado por la posición ordinal del elemento dentro de su contenedor, creando un efecto de cascada donde cada tarjeta o fila aparece secuencialmente.

**Clase de glow ambiental:** Aplica una sombra difusa grande coloreada con el acento Cyan detrás de elementos interactivos destacados (botones primarios, tarjetas seleccionadas), creando un resplandor ambiental sutil que aumenta de intensidad en hover.

**Clase de estado skeleton (shimmer):** Define una animación de gradiente lineal que se desplaza horizontalmente sobre un fondo gris neutro, simulando el estado de carga de contenido. Se parametriza para diferentes formas: rectángulos para textos, círculos para avatares, y rectángulos anchos para tablas.

**Clase de spinner institucional:** Define una animación de rotación de doble anillo concéntrico, donde el anillo exterior gira en sentido horario y el interior en sentido antihorario, ambos con el color Cyan del tema. Se usa como indicador de carga principal del sistema.

---

### 1.3 — Landing Page: Diseño y Componentes

La Landing Page es la primera impresión del proyecto y debe comunicar profesionalismo, sofisticación técnica y propósito cívico. Se compone de las siguientes secciones verticales:

**Barra de navegación superior:** Fija en la parte superior de la ventana (sticky), con superficie de vidrio esmerilado que permite ver el contenido desplazándose por debajo. Contiene el logotipo de VeedorIA (isotipo + texto) alineado a la izquierda, enlaces de navegación interna (anclas suaves a las secciones de la página), un selector de idioma (ES/EN) que cambia las traducciones via i18next sin recargar la página, y un botón de cambio de tema (icono Moon/Sun con animación de rotación al alternar) que persiste la preferencia en localStorage.

**Sección Hero:** Ocupa el viewport completo (100vh). Fondo con un gradiente radial sutil desde el centro (Navy claro) hacia las esquinas (Navy profundo), con partículas flotantes semitransparentes animadas con CSS puro (no canvas) para dar sensación de movimiento ambiental sin impacto en rendimiento. En el centro, el título principal "VeedorIA" en tipografía grande (clamp responsive entre 3rem y 5rem) con un degradado de texto de Cyan a Teal. Debajo, un subtítulo descriptivo en texto secundario. Un botón de llamada a la acción (CTA) sobredimensionado con borde de vidrio y efecto de glow pulsante que invita a explorar el dashboard o iniciar sesión. Al hacer scroll, la sección Hero se desvanece con un efecto parallax sutil (desplazamiento del fondo a velocidad diferente al contenido).

**Sección de Módulos del Negocio:** Tres tarjetas de vidrio dispuestas horizontalmente (grid responsive que se apila en móvil) que presentan los tres flujos del sistema: (1) Monitoreo Institucional — para entidades gubernamentales que desean auditar sus propios procesos internos, (2) Inteligencia de Mercado — para firmas auditoras y oferentes que necesitan análisis comparativo de precios y detección de competidores, (3) Portal Ciudadano — acceso gratuito para periodistas, investigadores y ciudadanos que quieran explorar datos públicos. Cada tarjeta tendrá un icono grande de Lucide animado, título, descripción corta, y un enlace "saber más" con hover elástico.

**Sección Pipeline Visual:** Un diagrama horizontal interactivo que ilustra el flujo de datos del sistema en 4 pasos: Ingestión (icono de API + texto "Datos DGCP en tiempo real") → Almacenamiento (icono de base de datos + texto "Normalización OCDS") → Análisis (icono de cerebro + texto "IA + Machine Learning") → Acción (icono de escudo + texto "Alertas y Reportes"). Cada paso se conecta con una línea animada que simula flujo de datos (partículas Cyan que se desplazan de izquierda a derecha). Al hacer hover sobre cada paso, se expande un tooltip de vidrio con detalles adicionales.

**Sección de Estadísticas (datos simulados inicialmente):** Contadores animados que muestran métricas de impacto: "X Procesos Analizados", "X Anomalías Detectadas", "X Millones DOP Monitoreados". Los números se animan con un efecto de incremento progresivo (conteo desde 0 hasta el valor final) cuando la sección entra en el viewport (Intersection Observer).

**Footer institucional:** Fondo Navy profundo con logo en versión monocromática, enlaces de navegación, y un badge "Powered by Datos Abiertos DGCP" que enlaza a la fuente oficial de datos.

#### Guías Aplicables
*   [Diseño Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part01-visual-theme-atmosphere-to-inputs-forms.md): Temas, atmósfera y efectos de resplandor
*   [Diseño Parte 5](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part05-full-page-loading-to-2-the-theme-block.md): Toggler de doble tema y persistencia
*   [Diseño Parte 6](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part06-3-resulting-utility-classes-to-6-file-organization.md): Clases de utilidad y estructura
*   [React Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part03-preloading-critical-routes-to-file-structure.md): Estructura de directorios Presentation/Pages

---

## Fase 2: Backend de Ingestión ETL y API REST Base

**Objetivo:** Construir el pipeline completo de descarga, transformación y almacenamiento de datos reales de la API DGCP, junto con los endpoints REST necesarios para que el frontend pueda consultar y filtrar los datos almacenados.

**Duración estimada:** Semanas 3-4

---

### 2.1 — Cliente HTTP Asíncrono para la API DGCP

Se desarrollará un módulo dedicado dentro de la capa de infraestructura del backend que encapsule toda la comunicación con la API de datos abiertos de la DGCP. Este cliente será completamente asíncrono (basado en httpx con soporte async/await nativo).

**Estructura de la API DGCP:** La API expone datos en formato OCDS (Open Contracting Data Standard). El endpoint principal devuelve "releases" paginados — cada release es un documento JSON que contiene información completa de un proceso de contratación: identificación del comprador, planificación, licitación, adjudicación, contrato y ejecución. Los releases pueden tener múltiples estados y se actualizan incrementalmente.

**Manejo de paginación:** La API devuelve resultados paginados con un cursor de siguiente página. El cliente implementará un iterador asíncrono que automáticamente solicite las páginas siguientes hasta agotar los resultados o alcanzar un límite configurado. Cada solicitud incluirá headers de identificación (User-Agent descriptivo) y respetará un delay configurable entre peticiones para no sobrecargar el servidor público.

**Manejo de errores y reintentos:** Se implementará una estrategia de reintentos exponenciales (backoff) para manejar errores transitorios de red (timeouts, errores 5xx). Después de un número máximo de reintentos configurado, el error se registrará en logs y el proceso continuará con la siguiente página, evitando que un fallo puntual detenga toda la ingestión.

**Filtros de consulta:** El cliente expondrá parámetros para filtrar releases por rango de fechas de publicación, institución compradora, método de contratación, y estado del proceso. Estos filtros se traducirán a query parameters de la API DGCP.

---

### 2.2 — Pipeline de Transformación y Almacenamiento (ETL)

El servicio de ingestión actuará como orquestador del pipeline ETL completo:

**Extracción:** Invoca al cliente HTTP asíncrono para descargar lotes de releases crudos de la DGCP. Cada lote se almacena temporalmente en memoria como una lista de diccionarios Python.

**Transformación:** Cada release OCDS crudo se procesa mediante un mapeador dedicado que extrae y normaliza los campos relevantes para el esquema relacional de la base de datos. El mapeador realizará las siguientes transformaciones:
*   Extraer la información de la institución compradora del campo `buyer` del release y normalizarla al modelo `Institution`. Si la institución ya existe en la base de datos (por su identificador DGCP), se actualizarán sus contadores acumulados.
*   Extraer los datos del proceso del campo `tender` y mapearlos al modelo `Process`, traduciendo los códigos de método de contratación de la DGCP al vocabulario interno del sistema.
*   Extraer los contratos adjudicados del array `contracts` del release y mapearlos al modelo `Contract`, vinculándolos al proceso padre.
*   Para cada contrato, extraer los ítems de su array `items` y mapearlos al modelo `Item`, preservando el código UNSPSC cuando esté presente.
*   Extraer la información del proveedor adjudicado del campo `suppliers` de cada adjudicación y normalizar al modelo `Supplier`, usando el RNC como clave de deduplicación.

**Deduplicación:** Todas las operaciones de escritura usarán la operación `upsert` (o verificar existencia antes de insertar) mediante SQLModel/SQLAlchemy: si el registro ya existe (identificado por su campo único), se actualiza; si no existe, se crea. Esto permite ejecutar la ingestión múltiples veces sobre el mismo rango de fechas sin generar duplicados.

**Carga:** Las escrituras a SQLite se ejecutarán en transacciones agrupadas (batches de tamaño configurable, por ejemplo, 100 releases por transacción) para optimizar el rendimiento de escritura. Cada transacción es atómica: si falla una escritura individual, se revierte todo el batch y se registra el error sin afectar batches anteriores ya confirmados.

**Script CLI de ingestión:** Se creará un comando CLI invocable desde la terminal que acepte argumentos para fecha de inicio, fecha de fin, institución, y tamaño de batch. Este script importará y ejecutará el servicio de ingestión directamente, permitiendo al desarrollador controlar exactamente qué datos se descargan y cuándo, sin necesidad de que el servidor FastAPI esté corriendo.

---

### 2.3 — Endpoints REST para Consulta de Datos y Analítica B2B

Se implementarán los routers y controladores REST que exponen los datos almacenados al frontend, sirviendo tanto a la vista pública de fiscalización como a la consola de analítica comercial B2B:

**Router de Procesos:** Endpoint de listado paginado que acepte filtros por: rango de fechas, institución, método de contratación, estado, rango de montos, y término de búsqueda textual (búsqueda parcial en título). La respuesta se envolverá en el esquema `ApiResponse` que incluye la lista de resultados, metadatos de paginación (página actual, total de páginas, total de resultados), y timestamp de la respuesta. Un segundo endpoint de detalle devuelve un proceso individual con sus contratos, ítems y anomalías asociadas anidadas.

**Router de Instituciones:** Endpoint de listado con búsqueda por nombre y ordenamiento por cantidad de procesos o monto acumulado. Endpoint de detalle que incluye estadísticas resumidas de la institución (total de procesos por estado, monto promedio, distribución de métodos de contratación).

**Router de Proveedores:** Endpoint de listado con búsqueda por nombre o RNC. Endpoint de detalle que muestra el historial de contratos ganados, instituciones con las que ha contratado, y montos acumulados.

**Router de Dashboard General:** Endpoint especial de agregación que calcula y devuelve métricas de resumen en una sola petición: total de procesos en la base de datos, total de contratos, monto total monitoreado, conteo de anomalías por tipo y severidad, top 10 instituciones por monto, y top 10 proveedores por frecuencia de adjudicación.

**Router de Analítica B2B (Market Intelligence):** Endpoints dedicados exclusivamente a la inteligencia comercial de oferentes (bajo plan de suscripción):
*   *Endpoint de Tendencia de Precios:* Devuelve la fluctuación del precio unitario histórico para un código UNSPSC específico en los últimos 24 meses, calculando el precio mínimo, precio máximo y la mediana móvil para permitir estimaciones competitivas de ofertas.
*   *Endpoint de Cuota de Mercado:* Devuelve la distribución de montos adjudicados entre competidores en una categoría UNSPSC, identificando el porcentaje de concentración de mercado y líderes del sector.
*   *Endpoint de Histograma de Éxito:* Agrupa los precios adjudicados en rangos para identificar el rango de precio unitario con mayor tasa de adjudicaciones exitosas (el "punto dulce" de precio).
*   *Endpoint de Comportamiento del Comprador:* Analiza qué instituciones compran más un determinado código de producto, detallando montos anuales acumulados y métodos de contratación preferidos (Licitación vs. Compra Menor).

**Validación de entrada:** Todos los query parameters se validarán mediante modelos Pydantic de entrada. Si un parámetro no cumple las restricciones (por ejemplo, fecha en formato inválido, página negativa, tamaño de página mayor a 100), FastAPI devolverá automáticamente un error 422 con el detalle del campo inválido.

**Manejo de errores consistente:** Todas las excepciones del sistema se canalizarán a través del modelo `AppError`, que define excepciones tipadas para cada caso: `NotFoundError` (404) cuando un recurso no existe, `ValidationError` (422) cuando los datos de entrada son inválidos, `AuthenticationError` (401) cuando el token JWT falta o es inválido, y `AuthorizationError` (403) cuando el usuario no tiene el rol requerido. Un middleware global capturará estas excepciones y las convertirá al formato `ApiResponse` con el campo `success: false`.

#### Guías Aplicables
*   [Python Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part03-domain-layer-pydantic-validation-to-custom-validators.md): Esquemas Pydantic de entrada/salida
*   [Python Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part04-server-utilities-to-envelope-responses.md): ApiResponse envolvente y AppError
*   [Python Parte 5](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part05-fastapi-routers-controllers-to-dependency-injection.md): APIRouter, controladores y DI

---

### 2.4 — Dashboards del Frontend (Público y Consola B2B)

Se desarrollarán las interfaces del dashboard, adaptando la experiencia según el perfil de usuario (Ciudadano/Auditor vs. Empresa/Oferente):

#### Consola General (Público / Auditores):
*   **Layout del Dashboard:** Estructura de dos zonas: un sidebar izquierdo colapsable (ancho fijo de 260px expandido, 64px colapsado) con navegación vertical iconizada, y un área de contenido principal que ocupa el espacio restante. El sidebar tendrá superficie de vidrio con los enlaces de navegación agrupados por sección: Exploración (Procesos, Instituciones, Proveedores), Análisis (Anomalías, Redes de Colusión), y Administración (Usuarios, Bitácora). El estado colapsado/expandido del sidebar se persistirá en localStorage.
*   **Barra superior del contenido:** Contendrá una barra de búsqueda global con ícono de lupa y shortcut de teclado (Ctrl+K) para activarla, el nombre de la sección actual como breadcrumb, un indicador del estado de sincronización con la DGCP (último timestamp de ingestión), y el avatar/nombre del usuario con un dropdown de opciones.
*   **Vista de tabla de Procesos:** La tabla principal mostrará procesos con columnas para: código, título (truncado con ellipsis y tooltip en hover), institución, método, estado (badge coloreado con los colores semánticos del diseño), monto estimado (formateado con separador de miles y símbolo DOP), fecha de publicación, y un indicador de anomalías (ícono de alerta si tiene anomalías pendientes). La tabla soportará: ordenamiento por cualquier columna (clic en el header), filtros en tiempo real por cada columna (campos de texto/select en la fila de filtros), paginación con controles de página y selector de tamaño de página, y selección de filas (checkboxes) para acciones batch. Los estados de carga mostrarán filas skeleton con la animación shimmer del sistema de diseño.
*   **Panel de filtros avanzados:** Un panel colapsable sobre la tabla que permite combinar múltiples criterios de filtrado: rango de fechas (datepicker dual con presets de "últimos 7 días", "último mes", "último trimestre"), selector múltiple de instituciones (combobox con búsqueda), selector múltiple de métodos de contratación, rango de montos (slider dual con labels de valor), y estado del proceso. Los filtros activos se mostrarán como badges removibles debajo del panel.

#### Consola B2B de Inteligencia de Licitaciones (Empresas/Oferentes):
*   **Layout de Analítica Comercial:** Un panel de control orientado al negocio (Business Intelligence) enfocado en identificar oportunidades de venta y analizar la competencia directa. Utiliza una interfaz limpia con componentes delgados y tipografía premium.
*   **Vista de Tendencia de Precios:** Gráfico interactivo de líneas que representa el histórico de precios unitarios adjudicados de la categoría de interés de la empresa. El gráfico muestra bandas de precios mínimos y máximos para que el usuario identifique desviaciones anormales de mercado y ajuste sus propuestas económicas.
*   **Panel de Competidores Directos:** Gráfico de anillo que visualiza la cuota de mercado en adjudicaciones públicas de la categoría de la empresa, listando a los competidores más frecuentes con sus montos acumulados y permitiendo comparar la tasa de éxito de su negocio contra ellos.
*   **Sección de "Punto Dulce" de Ofertas:** Histograma de barras verticales que agrupa los precios de ofertas ganadoras en rangos de precios unitarios, destacando el rango específico que ha tenido la mayor cantidad de adjudicaciones históricas exitosas para facilitar la toma de decisiones al ofertar.
*   **Filtro por Categorías UNSPSC Inscritas:** Panel de selección rápida de códigos UNSPSC (bienes/servicios) registrados por la empresa, permitiendo cambiar el dataset completo de analítica y el feed de alertas de nuevas licitaciones en un solo clic.

#### Guías Aplicables
*   [React Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part02-data-fetching-hooks-to-react-performance.md): Hooks de data fetching y control de re-renders
*   [React Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part04-configuration-to-i18n-conventions.md): Formateadores de moneda DOP y fecha local
*   [Diseño Parte 4](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part04-focus-indicators-to-loading-states.md): Estados skeleton y shimmer

---

## Fase 3: Motor de Inteligencia Artificial y Sistema de Banderas Rojas

**Objetivo:** Desarrollar los algoritmos de detección de anomalías que constituyen el valor diferenciador del sistema — transformando datos crudos de compras públicas en alertas accionables de posible fraude o irregularidad.

**Duración estimada:** Semanas 5-6

---

### 3.1 — Motor Isolation Forest para Anomalías de Precios

El algoritmo Isolation Forest es la pieza central del motor de ML. Su lógica se basa en el principio de que los puntos anómalos son "más fáciles de aislar" que los puntos normales en un espacio de características.

**Preparación de datos:** El servicio de análisis consultará la base de datos para obtener todos los ítems que comparten un mismo código UNSPSC (categoría de producto). Por ejemplo, todos los ítems clasificados como "Computadoras portátiles" (código UNSPSC 43211503) se agruparán para formar el dataset de entrenamiento de ese segmento. Para cada ítem, se construirá un vector de características que incluya: precio unitario, cantidad comprada, monto total de la línea, ratio precio/cantidad, y opcionalmente el monto total del contrato padre como proxy de volumen.

**Segmentación por categoría UNSPSC:** Es crítico que Isolation Forest no se entrene sobre todos los ítems juntos — un precio de $50,000 DOP es normal para una computadora pero anómalo para resmas de papel. Por eso, el motor segmentará los datos por código UNSPSC y entrenará un modelo independiente para cada segmento con suficientes observaciones (mínimo configurable, por ejemplo, 30 ítems). Los segmentos con menos observaciones se analizarán con reglas heurísticas simples (comparación con la mediana del segmento más cercano en la jerarquía UNSPSC) en lugar de Isolation Forest.

**Entrenamiento y predicción:** Para cada segmento, se instanciará un modelo Isolation Forest con parámetros configurados: número de árboles estimadores (100 por defecto), tasa de contaminación esperada (porcentaje de outliers esperado, inicialmente 5%), y semilla aleatoria fija para reproducibilidad. El modelo se entrenará sobre el dataset del segmento y luego predecirá un puntaje de anomalía para cada ítem. Los ítems con puntaje por debajo del umbral (los más anómalos) se marcarán como outliers.

**Ejecución en ProcessPoolExecutor:** Dado que scikit-learn utiliza computación numérica intensiva (NumPy/C extensiones), el entrenamiento y predicción de cada segmento se ejecutarán dentro de un `ProcessPoolExecutor`. El servicio de FastAPI invocará la función de análisis mediante `asyncio.run_in_executor`, lo cual permite que el event loop de FastAPI continúe atendiendo peticiones HTTP mientras el análisis de ML se ejecuta en un proceso separado del sistema operativo. El número de workers del pool se configurará como variable de entorno (por defecto, la mitad de los núcleos de CPU disponibles).

**Generación de explicaciones legibles:** Para cada anomalía detectada, el motor calculará y almacenará una explicación comprensible. El proceso será: (1) calcular la mediana y desviación estándar del precio unitario del segmento UNSPSC, (2) calcular el porcentaje de desviación del precio del ítem anómalo respecto a la mediana (por ejemplo, "+340% sobre la mediana"), (3) construir una oración descriptiva que combine el nombre del producto, el precio pagado, el precio mediano del mercado, y el porcentaje de desviación (por ejemplo, "El precio unitario de DOP $180,000 por Computadora Portátil supera en un 340% la mediana del mercado de DOP $41,000 para productos similares en la categoría UNSPSC 43211503"). Esta explicación se almacenará en el campo de descripción de la tabla `Anomaly`.

---

### 3.2 — Detector de Fraccionamiento de Compras

El fraccionamiento es una técnica donde un comprador divide una compra grande en múltiples compras menores para evadir los umbrales que exigen licitación pública (en República Dominicana, las compras menores no requieren proceso competitivo abierto).

**Lógica de detección:** El servicio analizará los procesos de una misma institución dentro de una ventana temporal configurable (por defecto, 30 días). Para cada institución, agrupará los procesos de "Compra Menor" o "Comparación de Precios" por similitud en sus ítems (comparando descripciones de ítems con fuzzy matching Levenshtein y códigos UNSPSC). Si el monto acumulado de un grupo de procesos similares supera el umbral de licitación pública (definido en la Ley 340-06 de Compras y Contrataciones), se generará una alerta de fraccionamiento con severidad proporcional a cuánto supera el umbral.

**Parámetros de sensibilidad:** El umbral de similitud textual de Levenshtein (ratio mínimo de 0.7 por defecto), la ventana temporal de agrupación, y los umbrales monetarios de la ley serán configurables en las variables de entorno del backend para permitir ajuste fino sin modificar código.

---

### 3.3 — Panel de Auditor en el Frontend

Se desarrollará la interfaz que permite a los auditores revisar, investigar y resolver las anomalías detectadas:

**Vista de bandeja de alertas:** Una lista vertical de tarjetas de anomalía ordenadas por severidad descendente. Cada tarjeta mostrará: un indicador visual de severidad (barra lateral coloreada del rojo al amarillo), el tipo de anomalía (badge), el título del proceso afectado, la explicación legible generada por el motor, el monto involucrado, y la fecha de detección. Las tarjetas se podrán filtrar por tipo de anomalía, severidad mínima, y estado de revisión (pendiente, confirmada, descartada).

**Panel Drawer de detalle:** Al hacer clic en una anomalía, se desplegará un panel lateral (drawer) que ocupa el 40% derecho de la pantalla con animación de deslizamiento suave. Este drawer contendrá:
*   Un **velocímetro semicircular de riesgo** (gauge chart) que visualice la severidad en una escala de 0 a 100 con gradiente de verde a rojo.
*   Un **gráfico de dispersión (scatter plot)** que muestre los precios unitarios de todos los ítems del mismo segmento UNSPSC, con el ítem anómalo resaltado en rojo pulsante y la mediana del mercado como línea horizontal de referencia.
*   Una **línea temporal** que muestre todos los procesos de la misma institución en los últimos 90 días, resaltando posibles patrones de fraccionamiento.
*   **Botones de acción** para que el auditor marque la anomalía como "Confirmada" (requiere comentario obligatorio) o "Descartada" (requiere justificación), registrando la acción en la tabla `AuditLog`.

#### Guías Aplicables
*   [Python Parte 7](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part07-performance-concurrency-to-ml-offloading.md): ProcessPoolExecutor para ML
*   [Diseño Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part02-status-icons-to-tooltips.md): Iconos de estado semánticos y tooltips
*   [Diseño Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part03-alerts-banners-to-contrast-ratios.md): Banners de alerta por severidad

---

## Fase 4: Redes de Colusión y Visualización de Grafos Relacionales

**Objetivo:** Detectar relaciones sospechosas entre proveedores del gobierno que sugieran acuerdos colusorios, y visualizar estas redes de manera interactiva para que los auditores puedan investigar las conexiones.

**Duración estimada:** Semanas 7-8

---

### 4.1 — Motor de Detección de Colusión (Backend)

La colusión en contrataciones públicas ocurre cuando proveedores supuestamente competidores coordinan sus ofertas (bid-rigging). Las señales de colusión que el motor buscará son:

**Análisis de datos de contacto compartidos:** El servicio consultará la tabla `Supplier` y comparará los campos de contacto entre todos los pares de proveedores. Se buscará: teléfonos idénticos o que difieran en un solo dígito, direcciones que coincidan en calle y número (ignorando diferencias menores en formato), correos electrónicos con el mismo dominio corporativo (excluyendo dominios genéricos como gmail, hotmail, yahoo), y representantes legales en común. Cada coincidencia se registrará como un "enlace relacional" con un peso proporcional a la rareza de la coincidencia (un teléfono compartido es más sospechoso que un dominio de email compartido).

**Fuzzy matching de nombres:** Los nombres de proveedores se compararán entre sí usando el algoritmo de distancia Levenshtein normalizada. Proveedores con nombres muy similares (ratio superior a 0.85) pero identificadores fiscales diferentes se marcarán como posibles variaciones de una misma entidad (por ejemplo, "Constructora Pérez SRL" vs "Constructora Perez & Asociados SRL"). Estas coincidencias sugieren la creación de empresas fachada por el mismo beneficiario real.

**Análisis de patrones de licitación:** Se analizarán los patrones de participación y adjudicación de los proveedores: proveedores que siempre participan juntos en los mismos procesos (co-ocurrencia alta), proveedores que se "turnan" para ganar procesos en la misma institución (patrón de rotación), y proveedores que ofertan precios sospechosamente cercanos al techo presupuestario.

**Construcción del grafo con NetworkX:** Todos los proveedores se representarán como nodos de un grafo no dirigido en NetworkX. Cada relación sospechosa detectada (contacto compartido, nombre similar, co-ocurrencia alta) se representará como una arista ponderada entre los dos proveedores involucrados, donde el peso refleja la intensidad de la sospecha. Se aplicarán algoritmos de análisis de redes: detección de comunidades (Louvain) para identificar clusters de proveedores densamente conectados, cálculo de centralidad de grado para identificar proveedores "hub" que conectan múltiples comunidades sospechosas, y cálculo de betweenness centrality para encontrar proveedores intermediarios que conectan clusters separados.

**Exportación de la red:** El resultado del análisis se serializará en un formato JSON consumible por D3.js en el frontend: un array de nodos (cada nodo con id, nombre, RNC, puntaje de centralidad, y comunidad asignada) y un array de enlaces (cada enlace con source, target, tipo de relación, y peso).

---

### 4.2 — Visualización Interactiva de Grafos (Frontend)

Se construirá una vista dedicada del dashboard para explorar las redes de colusión de manera visual e interactiva:

**Lienzo de fuerza D3.js:** El componente principal será un gráfico de fuerzas (force-directed graph) renderizado en SVG. La simulación de fuerzas de D3 posicionará automáticamente los nodos de forma que los proveedores más conectados entre sí queden cerca y los menos relacionados se separen. Las fuerzas configuradas incluirán: atracción de enlace (los nodos conectados se atraen), repulsión de carga (todos los nodos se repelen para evitar solapamiento), gravedad central suave (para que la red no se disperse hacia los bordes), y fuerza de colisión (para que los nodos no se superpongan).

**Codificación visual:** Los nodos se representarán como círculos cuyo radio será proporcional al monto total de contratos del proveedor (proveedores con más contratos serán más grandes). El color del nodo indicará la comunidad a la que pertenece (cada cluster detectado por Louvain tendrá un color distinto de la paleta). Las aristas se dibujarán como curvas de Bézier cuyo grosor reflejará el peso de la relación y cuyo color indicará el tipo (rojo para contacto compartido, naranja para nombre similar, amarillo para co-ocurrencia). Un halo de glow pulsante resaltará los nodos con mayor centralidad.

**Interactividad:** El grafo soportará: zoom y pan con gestos de ratón/trackpad, arrastrar nodos individuales para reorganizar la red manualmente, hover sobre un nodo para resaltar solo sus conexiones directas (atenuando el resto del grafo), clic en un nodo para abrir un tooltip de vidrio con los detalles del proveedor (nombre, RNC, contratos, montos, comunidad), y un modo de selección que permite hacer clic en dos nodos para ver los detalles de la relación entre ellos.

**Controles de filtrado:** Un panel lateral permitirá filtrar la red por: umbral mínimo de peso de relación (slider que oculta aristas débiles para reducir el ruido visual), tipo de relación (checkboxes para mostrar/ocultar cada tipo), institución (mostrar solo proveedores que han contratado con una institución específica), y rango de fechas (limitar el análisis a un período temporal).

**Rendimiento y optimización:** Para grafos grandes (más de 500 nodos), se implementarán optimizaciones: limitación del número de iteraciones de la simulación de fuerzas, uso de `requestAnimationFrame` para el renderizado suave, desactivación de la simulación cuando el usuario no está interactuando, y virtualización de etiquetas de texto (solo mostrar labels de nodos visibles en el viewport actual).

#### Guías Aplicables
*   [React Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part02-data-fetching-hooks-to-react-performance.md): Control de re-renders para gráficos pesados
*   [React Parte 3](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part03-preloading-critical-routes-to-file-structure.md): Preloading de chunks de D3
*   [Diseño Parte 6](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part06-3-resulting-utility-classes-to-6-file-organization.md): Márgenes asimétricos de layouts complejos

---

## Fase 5: Autenticación Local, Roles de Negocio y Bitácora de Auditoría

**Objetivo:** Implementar un sistema completo de gestión de accesos con roles diferenciados que controlen qué funcionalidades ve cada tipo de usuario, junto con una bitácora inmutable que registre toda actividad significativa del sistema.

**Duración estimada:** Semana 9

---

### 5.1 — Sistema de Autenticación JWT (Backend)

**Registro de usuarios:** El endpoint de registro aceptará email, contraseña y nombre completo. La contraseña se validará con restricciones de complejidad (mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial). Antes de almacenarla, se hasheará con bcrypt usando un costo de 12 rondas. El resultado es un hash irreversible que se guarda en la base de datos. El ID del usuario se generará como UUID v4, no como entero autoincremental, para facilitar la futura migración a Supabase Auth que usa UUIDs nativos.

**Login y generación de tokens:** El endpoint de login verificará las credenciales comparando el hash bcrypt almacenado contra la contraseña proporcionada (función de verificación de tiempo constante para prevenir timing attacks). Si la verificación es exitosa, se generará un par de tokens JWT: un access token de corta duración (15 minutos) que contiene el UUID del usuario, su email y su rol embebidos en el payload, y un refresh token de larga duración (7 días) almacenado como registro en SQLite para permitir revocación explícita. Ambos tokens se firmarán con HMAC-SHA256 usando la clave secreta del archivo `.env`.

**Middleware de autenticación:** Se creará una dependencia de FastAPI reutilizable que extraiga el token JWT del header Authorization (formato Bearer), lo decodifique, verifique su firma y expiración, y devuelva el modelo del usuario actual. Si el token es inválido o ha expirado, se lanzará un `AuthenticationError` (HTTP 401). Esta dependencia se inyectará en todos los endpoints que requieran autenticación.

**Guardianes de rol:** Se crearán dependencias adicionales parametrizadas por rol que, después de autenticar al usuario, verificarán que su rol sea el requerido para acceder al recurso. Por ejemplo, un guardián `require_role(ADMIN)` permitirá el acceso solo a usuarios con rol ADMIN y lanzará un `AuthorizationError` (HTTP 403) para cualquier otro rol.

**Roles del sistema y sus permisos:**
*   **ADMIN:** Acceso total. Puede gestionar usuarios, ejecutar ingestiones de datos, configurar parámetros del motor ML, y revisar todas las anomalías.
*   **AUDITOR:** Acceso al dashboard completo, panel de anomalías, redes de colusión, y capacidad de confirmar/descartar alertas con justificación. No puede gestionar usuarios ni configurar el sistema.
*   **BIDDER (Oferente):** Acceso limitado a la vista de procesos en los que ha participado, sus propios datos de proveedor, y reportes comparativos de precios de mercado. No puede ver anomalías de otros proveedores.
*   **CITIZEN (Ciudadano):** Acceso de solo lectura al portal público. Puede buscar procesos, ver estadísticas agregadas, y descargar datos en formatos abiertos. No puede ver detalles de anomalías individuales ni redes de colusión.

---

### 5.2 — Flujo de Autenticación en el Frontend

**Contexto de autenticación React:** Se creará un Context Provider que almacene el estado de autenticación (usuario actual, access token, refresh token) y exponga funciones para login, logout, y refresh automático. El access token se almacenará en memoria (variable de estado React) y nunca en localStorage (para prevenir ataques XSS). El refresh token se almacenará en una cookie httpOnly (aunque en desarrollo local con SQLite, se usará localStorage como simplificación, con la intención de migrar a cookies httpOnly en producción).

**Interceptor de Axios:** Se configurará un interceptor de peticiones en la instancia global de Axios que automáticamente adjunte el access token en el header Authorization de cada petición API. Un segundo interceptor de respuestas detectará errores 401 (token expirado) y automáticamente ejecutará el flujo de refresh: enviar el refresh token al endpoint de renovación, obtener un nuevo access token, y reintentar la petición original de forma transparente para el usuario. Si el refresh también falla (refresh token expirado o revocado), se redirigirá al usuario a la pantalla de login.

**Rutas protegidas:** Se implementará un componente wrapper que verifique el estado de autenticación antes de renderizar las rutas protegidas del dashboard. Si el usuario no está autenticado, se redirigirá a la página de login. Si el usuario está autenticado pero su rol no tiene permiso para la ruta solicitada, se mostrará una pantalla de "Acceso Denegado" con estilo institucional.

**Pantalla de login:** Formulario de vidrio centrado en la pantalla con campos de email y contraseña estilizados según las guías de diseño (campos translúcidos con foco Cyan, validación inline, botón de toggle para mostrar/ocultar contraseña). Animación de entrada con el logo de VeedorIA y el fondo con el gradiente institucional.

---

### 5.3 — Bitácora de Auditoría Inmutable

**Principio de diseño:** La tabla `AuditLog` funciona como un libro contable: solo se escriben registros, nunca se modifican ni eliminan. Cada acción significativa del sistema genera una entrada que captura el antes y después del cambio.

**Acciones registradas:** Login exitoso y fallido (con IP de origen), cambio de estado de una anomalía (de PENDING a CONFIRMED o DISMISSED, capturando el comentario del auditor), ejecución de un ciclo de ingestión de datos (número de registros procesados, errores encontrados), exportación de reportes, creación y modificación de usuarios, y cambios en la configuración del sistema.

**Servicio de auditoría:** Se creará un servicio transversal inyectable que exponga un método genérico para registrar acciones. Este método recibirá el tipo de acción, la entidad afectada, y los valores antes/después serializados como JSON. El servicio se inyectará como dependencia en todos los controladores que ejecuten acciones auditables, y se invocará después de que la acción principal se complete exitosamente (dentro de la misma transacción de base de datos cuando sea posible, para garantizar consistencia).

**Vista de bitácora en el frontend:** Accesible solo para usuarios ADMIN. Una tabla cronológica con filtros por tipo de acción, usuario, rango de fechas, y entidad afectada. Cada fila mostrará un diff visual estilizado (colores verde/rojo para valores añadidos/eliminados) cuando los campos "valor anterior" y "valor nuevo" estén presentes.

#### Guías Aplicables
*   [Python Parte 6](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part06-security-hardening-cors-to-jwt-auth.md): JWT Auth, bcrypt y guardianes de rol
*   [React Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part01-philosophy-to-app-with-lazy-routes.md): Rutas protegidas y Contexto de Auth
*   [Diseño Parte 1](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/design-part01-visual-theme-atmosphere-to-inputs-forms.md): Formularios con campos translúcidos

---

## Fase 6: Polish, Optimización de Rendimiento y Testing

**Objetivo:** Pulir la experiencia de usuario, optimizar el rendimiento en todas las capas, y establecer una suite de tests automatizados que garantice la estabilidad del sistema ante cambios futuros.

**Duración estimada:** Semana 10

---

### 6.1 — Optimización del Frontend

**Virtualización de listas largas:** Las tablas con potencialmente miles de filas (procesos, ítems, bitácora) implementarán virtualización: solo se renderizarán en el DOM las filas visibles en el viewport más un buffer de 5 filas arriba y abajo. El componente de tabla calculará la posición de scroll y determinará qué filas montar/desmontar dinámicamente, eliminando el costo de renderizado de filas ocultas.

**Code splitting por ruta:** Cada página del dashboard se cargará como un chunk JavaScript independiente mediante lazy loading de React Router. Esto significa que al visitar el dashboard por primera vez, solo se descarga el código de la vista activa, no el de todas las vistas. Las vistas pesadas (visualización D3 de redes de colusión) se cargarán bajo demanda cuando el usuario navegue a esa sección.

**Preloading de rutas críticas:** Cuando el usuario haga hover sobre un enlace de navegación del sidebar, se iniciará la pre-descarga del chunk de la ruta destino antes de que el usuario haga clic. Esto eliminará el delay de carga percibido al navegar entre secciones.

**Memoización de componentes costosos:** Los gráficos de D3, las tablas con filtros activos, y los paneles de estadísticas se envolverán en `React.memo` con comparadores personalizados para evitar re-renderizados innecesarios cuando cambien estados no relacionados.

**Caché de respuestas API:** Los hooks de data fetching implementarán un caché en memoria con estrategia stale-while-revalidate: al solicitar datos que ya fueron cargados previamente, se mostrarán inmediatamente los datos en caché mientras se ejecuta una petición de fondo para actualizar. Si los datos frescos son diferentes, se actualizará la UI de forma suave sin spinners.

---

### 6.2 — Testing Automatizado del Backend

**Tests unitarios de servicios:** Cada servicio de la capa de lógica de negocio tendrá tests unitarios que verifiquen su comportamiento con datos controlados. Los tests mockearán la capa de infraestructura (repositorios de SQLModel/SQLAlchemy y clientes HTTP) usando fixtures de Pytest y bases de datos SQLite en memoria de prueba para garantizar aislamiento.

**Tests del motor Isolation Forest:** Se crearán datasets sintéticos con anomalías conocidas (ítems con precios intencionalmente inflados en 3x, 5x, 10x respecto al rango normal) y se verificará que el motor los detecte correctamente. Se medirá la precisión (porcentaje de anomalías detectadas que son reales) y el recall (porcentaje de anomalías reales que son detectadas) sobre el dataset sintético.

**Tests de integración de endpoints:** Se usará `httpx.AsyncClient` como cliente de test para enviar peticiones HTTP a la aplicación FastAPI sin necesidad de levantar un servidor real. Estos tests verificarán: que los endpoints devuelvan los códigos de estado correctos (200, 201, 404, 401, 403, 422), que las respuestas cumplan el esquema `ApiResponse` esperado, que la paginación funcione correctamente, y que los filtros devuelvan solo los resultados que cumplen los criterios.

**Tests de autenticación:** Se verificará el flujo completo de registro → login → acceso protegido → refresh → acceso con token renovado → logout → acceso denegado. Se probarán también los casos de error: login con credenciales incorrectas, acceso con token expirado, acceso con rol insuficiente.

#### Guías Aplicables
*   [Python Parte 8](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/architecture-part08-unit-testing-pytest-to-mocking.md): Pytest, fixtures asíncronas y mocking
*   [React Parte 2](file:///c:/Users/jsjer/OneDrive/Bureaublad/New%20folder/Project%20I/veedoria-monorepo/.agents/rules/react-architecture-part02-data-fetching-hooks-to-react-performance.md): Performance y virtualización

---

## Fase 7: Despliegue y Migración a Producción

**Objetivo:** Preparar el sistema para acceso público, migrar los datos de SQLite local a PostgreSQL en la nube, y configurar la infraestructura de despliegue continuo.

**Duración estimada:** Semana 11+

---

### 7.1 — Despliegue del Frontend en Vercel

Se configurará el proyecto React/Vite para despliegue en Vercel. El archivo de configuración de Vercel definirá: el directorio de build (`frontend/`), el comando de build (`npm run build`), el directorio de salida (`dist/`), y las reglas de rewrite que redirigen todas las peticiones con prefijo `/api` al backend en Render. Estas reglas de rewrite son el equivalente en producción al proxy de Vite que se usó en desarrollo, eliminando problemas de CORS sin necesidad de configuraciones permisivas en el backend.

### 7.2 — Despliegue del Backend en Render

Se configurará Render para desplegar el backend FastAPI como un Web Service de Python. Se definirá: el directorio raíz (`backend/`), el comando de instalación de dependencias (`poetry install --no-dev`), el comando de inicio (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`), y las variables de entorno de producción (cadena de conexión PostgreSQL de Supabase, clave secreta JWT de producción, URL de la API DGCP, flag de modo producción).

### 7.3 — Migración de SQLite a PostgreSQL (Supabase)

**Ajuste del dialecto de base de datos:** Se modificará la cadena de conexión de SQLModel para apuntar a PostgreSQL en Supabase. Al usar SQLAlchemy 2.0 y SQLModel, la sintaxis SQL es compatible y solo se requiere generar una nueva migración con Alembic (`alembic revision --autogenerate`) para reflejar los tipos nativos de PostgreSQL en producción.

**Script de migración de datos:** Se desarrollará un script Python dedicado que: (1) conecte al archivo SQLite local y lea todos los registros de todas las tablas en orden de dependencias (primero instituciones, luego procesos, luego contratos, etc.), (2) conecte al PostgreSQL de Supabase mediante el mismo AsyncSession de SQLModel configurado con la nueva cadena de conexión, y (3) inserte los registros en batches transaccionales en PostgreSQL. Este script se ejecutará una sola vez como parte del proceso de migración.

**Migración futura a Supabase Auth:** Cuando se decida adoptar Supabase Auth en producción, la transición será directa porque los usuarios ya tienen UUIDs como identificadores. Se creará un script que: lea los usuarios de la tabla `User` de SQLite, cree las cuentas equivalentes en Supabase Auth (invocando la API de administración de Supabase), y actualice las referencias internas para usar el UUID de Supabase Auth (que debería ser el mismo si se migra correctamente).

### 7.4 — Documentación del Portafolio

Se redactará un README profesional en la raíz del monorepo que incluya: badges de tecnologías usadas, una captura de pantalla del dashboard principal, descripción del proyecto, arquitectura del sistema (diagrama de componentes), instrucciones de instalación y configuración local, instrucciones de ejecución de tests, y créditos a las fuentes de datos (DGCP, OCDS).

---

## Anexo A: Catálogo de Gráficas y Visualizaciones por Perfil de Usuario

Para garantizar la utilidad de la plataforma a través de sus tres dimensiones de monetización y adopción, el sistema de visualización de datos se segmenta por perfiles de usuario, adaptando la complejidad analítica y el enfoque visual a cada necesidad:

### 1. Perfil CivicTech (Ciudadanos, Periodistas y ONGs — Acceso Gratuito)
Orientado a la claridad absoluta, la rendición de cuentas directa y el consumo rápido sin conocimientos en ciencia de datos:
*   **Velocímetro Semicircular de Riesgo (Gauge Chart):** Muestra el nivel consolidado de sospecha de un contrato de 0 a 100 con códigos de color semánticos (Verde, Amarillo, Rojo). Funciona como un indicador de gasolina para captación intuitiva de peligro.
*   **Diagrama de Sankey para Flujo de Fondos:** Visualiza de forma dinámica la distribución del dinero público fluyendo desde ministerios hacia categorías de bienes y finalmente a proveedores individuales. Las líneas más anchas exponen concentraciones masivas de gasto de forma transparente.
*   **Mapa Coroplético e Interactivo de la República Dominicana:** Muestra geográficamente los procesos adjudicados por provincia. Identifica burbujas de gasto y permite realizar búsquedas por localidad para fiscalización comunitaria.
*   **Treemap Jerárquico de Presupuesto:** Representa el gasto estatal mediante rectángulos anidados proporcionales. Facilita la exploración interactiva de lo macro a lo micro (por ejemplo, desglosar el Ministerio de Salud Pública en departamentos y luego en tipos de insumos médicos).

### 2. Perfil B2B: Inteligencia Comercial (Empresas y Oferentes — Suscripción de Pago)
Enfocado en la competitividad de mercado, la formulación optimizada de ofertas y la analítica comercial:
*   **Gráfico de Tendencias y Bandas de Precios Adjudicados:** Gráfico de líneas temporales de 24 meses que muestra precios máximos, mínimos y la mediana móvil para un código UNSPSC. Permite a la empresa predecir rangos de ofertas competitivas y rentables.
*   **Gráfico de Anillo de Cuota de Mercado (Market Share):** Visualiza de forma porcentual la distribución de adjudicaciones en una categoría de producto específica, exponiendo la concentración entre proveedores líderes y competidores directos.
*   **Gráfico de Barras Apiladas de Comportamiento del Comprador:** Desglosa a los principales clientes gubernamentales de una categoría, detallando montos anuales comprados e identificando sus métodos de contratación preferidos.
*   **Histograma del "Punto Dulce" de Ofertas:** Agrupa las ofertas ganadoras en rangos de precios unitarios para ilustrar visualmente en qué valores específicos se concentra la mayor tasa de adjudicaciones exitosas.
*   **Gráfico de Embudo de Conversión (Bidding Funnel):** Mide la eficiencia del propio proveedor en sus etapas comerciales (Oportunidades detectadas → Ofertas presentadas → Aprobadas técnicamente → Adjudicadas).
*   **Diagrama de Caja y Bigotes (Box Plot) de Distribución de Ofertas:** Muestra la distribución estadística de ofertas en procesos ganados de su sector, facilitando la identificación de competidores agresivos por precios.

### 3. Perfil B2G: Fiscalización Interna (Auditores Gubernamentales y Organismos de Control — Suscripción de Pago)
Diseñado para la investigación criminal, auditoría preventiva forense y detección automatizada de delitos administrativos:
*   **Grafo de Redes de Colusión (NetworkX/D3.js):** Lienzo interactivo dirigido por fuerzas físicas que conecta proveedores (nodos) según vinculaciones de contacto (teléfonos, correos, direcciones compartidas) y fuzzy matching de nombres. Aísla automáticamente clusters sospechosos de licitar coordinadamente.
*   **Gráfico de Dispersión (Scatter Plot) de Outliers de Precios:** Grafica los precios unitarios individuales en un código UNSPSC a lo largo del tiempo, contrastando cada transacción contra la mediana del mercado para justificar visualmente acusaciones de sobreprecio.
*   **Heatmap de Calendario de Publicaciones:** Matriz horaria (días vs. horas) que expone anomalías temporales, marcando en colores oscuros convocatorias publicadas en horarios no hábiles o feriados para restringir competidores.
*   **Línea de Tiempo de Ciclo de Vida de Procesos:** Gantt que compara plazos reales entre hitos contra el histórico reglamentario para destacar procesos "exprés" diseñados a la medida de un único proveedor.
*   **Gráfico de Radar de Perfil de Riesgo (Spider Chart):** Evalúa multidimensionalmente a una institución o proveedor en base a variables de riesgo (fraccionamiento, sobreprecio, colusión, adjudicación única), creando un área sombreada cuyo volumen denota el nivel de alerta fiscalizadora.

---

## Protocolo de Verificación (QA Checklist)

Se establece un checklist exhaustivo de verificación para asegurar que cada módulo del sistema funcione correctamente y se integre sin fricciones:

### Verificación Visual y de Diseño
1.  **Doble tema:** Al alternar entre Light y Dark, todas las superficies de vidrio, sombras, textos y acentos se recalculan correctamente. El tema seleccionado persiste al recargar la página. No hay flasheo de tema incorrecto al cargar (FOUC prevention).
2.  **Responsive:** Todas las vistas se adaptan correctamente a breakpoints de escritorio (1920px, 1440px, 1280px), tablet (768px) y móvil (375px). El sidebar del dashboard se colapsa automáticamente en pantallas menores a 1024px.
3.  **Animaciones:** Las entradas escalonadas, los hovers de tarjeta, los spinners y los estados skeleton se ejecutan con fluidez a 60fps sin jank visual.
4.  **Accesibilidad:** Todos los elementos interactivos tienen indicadores de foco visibles. Los ratios de contraste entre texto y fondo cumplen WCAG AA (mínimo 4.5:1 para texto normal, 3:1 para texto grande). Los iconos decorativos tienen `aria-hidden` y los informativos tienen `aria-label`.

### Verificación de Ingestión de Datos
5.  **CLI de ingestión:** El script CLI descarga y transforma correctamente releases de la DGCP, insertándolos en SQLite sin duplicados. Al ejecutar el mismo rango de fechas dos veces, los contadores de registros no cambian (upsert efectivo).
6.  **Manejo de errores de red:** Si la API de la DGCP no responde, el script registra el error en logs, aplica backoff exponencial, y continúa con el siguiente batch sin abortar.
7.  **Integridad relacional:** Todos los contratos tienen un proceso padre válido. Todos los ítems tienen un contrato padre válido. Todos los proveedores referenciados en contratos existen en la tabla de proveedores.

### Verificación del Motor de IA
8.  **Isolation Forest:** Ante un dataset de prueba con precios inflados conocidos, el motor detecta al menos el 80% de los outliers inyectados. Las explicaciones generadas incluyen el porcentaje de desviación correcto respecto a la mediana.
9.  **Fraccionamiento:** Ante un conjunto de compras menores de la misma institución en la misma semana que suman más que el umbral de licitación, el motor genera una alerta de fraccionamiento con severidad proporcional.
10. **ML Offloading:** Durante la ejecución del análisis Isolation Forest, el backend continúa respondiendo a peticiones HTTP con latencia normal (menos de 200ms). El análisis se ejecuta en un proceso separado sin bloquear el event loop.

### Verificación de Redes de Colusión
11. **Fuzzy matching:** Proveedores con nombres similares (ratio Levenshtein mayor a 0.85) se vinculan correctamente en el grafo. Proveedores con nombres claramente diferentes no generan falsos positivos.
12. **Visualización D3:** El grafo renderiza correctamente hasta 200 nodos con interacciones fluidas (zoom, pan, drag). Los tooltips muestran información correcta del proveedor. Los filtros del panel lateral actualizan el grafo en tiempo real.

### Verificación de Autenticación, Seguridad y Roles
13. **Flujo de auth completo:** Registro → Login → Token válido → Acceso a ruta protegida → Token expirado → Refresh automático → Nuevo token válido → Logout → Token revocado → Acceso denegado.
14. **Guardianes de rol:** Un usuario CITIZEN no puede acceder a endpoints de ADMIN, AUDITOR o a las consolas B2B. Un usuario BIDDER tiene acceso exclusivo a sus endpoints de analítica de competencia y tendencias pero no puede ver la bitácora administrativa de auditoría ni alertas de colusión de otros oferentes.
15. **Bitácora:** Toda acción auditable genera una entrada en `AuditLog` con los campos correctamente poblados. La tabla no permite updates ni deletes a nivel de aplicación.

### Verificación del Dashboard de Inteligencia B2B
16. **Histórico y Tendencias:** Al seleccionar una categoría UNSPSC, el gráfico de líneas del oferente calcula y representa fielmente el precio mínimo, precio máximo y la mediana móvil histórica en base a los contratos de SQLite.
17. **Cálculo de Cuota de Mercado:** El gráfico de anillo computa correctamente la concentración de adjudicaciones por proveedor de la categoría seleccionada, igualando la suma de porcentajes al 100%.
18. **Filtros de Suscripción:** Al expirar o suspender una cuenta B2B (emulado cambiando metadata de usuario), el frontend bloquea la consola y redirige al usuario a la pantalla de selección de planes de suscripción.

### Verificación de Testing y Performance
19. **Backend tests:** `poetry run pytest tests/` ejecuta exitosamente toda la suite con 0 fallos. La cobertura de tests de servicios de lógica de negocio es superior al 80%.
20. **Build de producción:** `npm run build` en el frontend genera un bundle optimizado sin errores ni warnings de TypeScript. El bundle total (sin lazy chunks) es inferior a 200KB gzipped.

