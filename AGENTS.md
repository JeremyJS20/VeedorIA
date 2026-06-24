# VeedorIA — AI Agent Instructions

## Overview
VeedorIA is a premium public procurement monitoring platform for the Dominican Republic (OCDS standard) with:
- **Frontend:** React, Vite, HeroUI, TailwindCSS 4, React Router DOM 7, Lucide React
- **Backend:** Python, FastAPI, SQLModel + SQLAlchemy 2.0, Alembic, SQLite (local), PyJWT, bcrypt, scikit-learn
- **Design:** Institutional (Navy `#1B2A4A`, Teals, Cyan `#00B4D8`, double-theme, glassmorphism)

## Mandatory Rule
Before proposing or implementing ANY change, you MUST read the relevant
architecture and/or design rules in `.agents/rules/`. Changes that violate
these rules must be flagged and discussed with the user.

## Architecture Rules (`.agents/rules/`)
| File | Covers |
|---|---|
| `architecture-part01-*.md` | Philosophy, Python-FastAPI monorepo configuration (SQLModel, PyJWT, bcrypt), Ruff |
| `architecture-part02-*.md` | Database client lifecycle, connection pools (SQLModel/SQLAlchemy), Alembic migrations, Supabase route |
| `architecture-part03-*.md` | Domain schemas, Pydantic v2 validation, cross-validators |
| `architecture-part04-*.md` | Standard API JSON response wrappers, AppError exceptions |
| `architecture-part05-*.md` | FastAPI routers, Path/Query parameters, Depends injection (AsyncSession) |
| `architecture-part06-*.md` | Security, CORS configs, JWT tokens (PyJWT), direct bcrypt hashing |
| `architecture-part07-*.md` | Concurrency, ProcessPoolExecutor for CPU ML tasks |
| `architecture-part08-*.md` | Testing, pytest asyncio fixtures, in-memory SQLite DB assertions |
| `PYTHON_FASTAPI_ARCHITECTURE.md` | Core backend architecture reference |
| `REACT_VITE_TS_ARCHITECTURE.md` | Core frontend architecture reference |
| `react-architecture-part01-*.md` | Frontend philosophies, lazy routing, scaffolding |
| `react-architecture-part02-*.md` | React fetching hooks, mutation hooks, virtual lists |
| `react-architecture-part03-*.md` | Preloading chunks, Presentation/Domain folders |
| `react-architecture-part04-*.md` | i18next localizations, currency/date formatters |

## Design Rules (`.agents/rules/`)
| File | Covers |
|---|---|
| `INSTITUTIONAL_DESIGN.md` | Double-theme Institutional Design Manual |
| `design-part01-*.md` | Visual themes HSL, inputs, forms and opacity rules |
| `design-part02-*.md` | Status icon wrappers, animated pulses, tooltips |
| `design-part03-*.md` | Alert banners, WCAG contrast ratios |
| `design-part04-*.md` | Focus outlines, double-ring spinners, shimmer bars |
| `design-part05-*.md` | Switcher toggles, localStorage saving |
| `design-part06-*.md` | Spacing, asymmetry grids, margins |

## Workflow
1. **Identify** what kind of change you're making (architecture / design / both)
2. **Read** the relevant rule files from `.agents/rules/`
3. **Align** your implementation with those rules
4. **Verify** — run pytest, compile types, and lint files after making changes
5. **Ask** the user if something is unclear or not covered by the rules
