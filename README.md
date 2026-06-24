# VeedorIA

Plataforma premium de monitoreo de contrataciones públicas para la República Dominicana, basada en el estándar OCDS. Ofrece inteligencia de datos para ciudadanos, empresas y gobiernos con análisis profundo de datos abiertos.

## Tech Stack

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8, TailwindCSS 4, HeroUI v3, React Router DOM 7, Framer Motion, Lucide React, i18next |
| **Backend** | Python 3.11+, FastAPI, SQLModel + SQLAlchemy 2.0, Alembic, PyJWT, bcrypt, scikit-learn |
| **Database** | SQLite (local) con aiosqlite |
| **Diseño** | Institutional Design (Navy `#1B2A4A`, Teals, Cyan `#00B4D8`), doble tema, glassmorphism |
| **Tools** | Poetry, Ruff, ESLint, pytest |

## Estructura del Proyecto

```
veedoria-monorepo/
├── backend/                    # Python FastAPI
│   ├── src/
│   │   ├── config.py           # Configuración centralizada
│   │   ├── domain/             # Schemas Pydantic v2
│   │   ├── infrastructure/     # Database client, connection pools
│   │   ├── models/             # SQLModel (8 modelos)
│   │   │   ├── user.py
│   │   │   ├── supplier.py
│   │   │   ├── process.py
│   │   │   ├── item.py
│   │   │   ├── institution.py
│   │   │   ├── contract.py
│   │   │   ├── audit_log.py
│   │   │   └── anomaly.py
│   │   ├── presentation/       # FastAPI routers, main.py
│   │   └── services/           # Lógica de negocio
│   ├── migrations/             # Alembic
│   ├── tests/                  # pytest
│   ├── alembic.ini
│   ├── pyproject.toml          # Poetry config
│   └── .env.example
├── frontend/                   # React Vite TS
│   ├── src/
│   │   ├── presentation/
│   │   │   └── components/     # 15 componentes landing
│   │   ├── domain/             # Schemas de dominio
│   │   ├── infrastructure/     # API client, hooks
│   │   ├── i18n/               # Internacionalización
│   │   ├── validation/         # Validación de formularios
│   │   ├── assets/             # Logos, isotipos (webp)
│   │   └── index.css           # Tokens, glass, utilidades
│   ├── public/locales/         # es/ en translations
│   ├── package.json
│   └── vite.config.ts
├── database/                   # SQLite DB (.gitkeep)
├── .agents/rules/              # 22 reglas de arquitectura
├── AGENTS.md                   # Instrucciones para AI agents
└── .gitignore
```

## Prerrequisitos

- **Node.js** >= 20
- **Python** >= 3.11
- **Poetry** (para dependencias del backend)

## Instalación

### Backend

```bash
cd backend
poetry install
cp .env.example .env          # Editar JWT_SECRET en producción
poetry run alembic upgrade head
poetry run uvicorn src.presentation.main:app --reload --port 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

## Variables de Entorno

Copiar `backend/.env.example` a `backend/.env`:

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del backend | `3001` |
| `ENVIRONMENT` | Modo de ejecución | `development` |
| `DATABASE_URL` | URL de SQLite | `sqlite+aiosqlite:///../database/veedoria.db` |
| `JWT_SECRET` | Secreto para JWT (32+ chars) | *(placeholder)* |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` |
| `DGCP_API_BASE_URL` | API de datos abiertos DGCP | `https://datosabiertos.dgcp.gob.do/api-dgcp/v1` |

## Scripts Disponibles

### Frontend
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (tsc + vite build) |
| `npm run lint` | ESLint |
| `npm run preview` | Preview del build |

### Backend
| Comando | Descripción |
|---|---|
| `poetry run uvicorn src.presentation.main:app --reload` | Servidor de desarrollo |
| `poetry run pytest` | Ejecutar tests |
| `poetry run ruff check .` | Linter Python |
| `poetry run alembic upgrade head` | Aplicar migraciones |

## Arquitectura

### Backend (Clean Architecture)
- **`domain/`** — Schemas Pydantic v2 con validación cross-field
- **`infrastructure/`** — Database client con connection pools SQLModel/SQLAlchemy
- **`models/`** — SQLModel (8 modelos: User, Supplier, Process, Item, Institution, Contract, AuditLog, Anomaly)
- **`presentation/`** — FastAPI routers con Depends injection (AsyncSession)
- **`services/`** — Lógica de negocio, procesamiento CPU con ProcessPoolExecutor

### Frontend (Component-Based)
- **Componentes UI reutilizables** — Button, GlassCard, Badge, InsetPanel (wrappers de HeroUI)
- **Landing page** — 11 secciones: Navbar, Hero, SocialProof, Portals, PriceChecker, Stats, Pricing, FAQ, CTABanner, Footer
- **Doble tema** — Institutional Design con glassmorphism en light y dark
- **i18next** — Soporte ES/EN con detección automática de idioma
- **Logo** — Isotipo + texto con swap instantáneo de tema vía MutationObserver

### Design System
- **Fuentes** — Manrope (display/headings), Inter (body), JetBrains Mono (data)
- **Tokens** — CSS variables en `@theme` block de TailwindCSS 4
- **Glass** — `blur(16px)` con `rgba(255,255,255,0.7)` light / `rgba(17,19,25,0.7)` dark
- **Colores** — Navy `#003d9b` light / `#b2c5ff` dark (remapped for contrast)

## Contribuir

1. Leer `.agents/rules/` antes de proponer cambios
2. Seguir las convenciones de arquitectura y diseño establecidas
3. Ejecutar `npm run lint` (frontend) y `poetry run ruff check .` (backend) después de cambios
4. No commitear secrets, `.env`, ni archivos generados

## Licencia

Propietario — VeedorIA Team
