# VeedorIA — Google AI Agent Instructions

## Mandatory Rule
Before proposing or implementing ANY change, you MUST read the relevant
architecture and/or design rules in `.agents/rules/`. Changes that violate
these rules must be flagged and discussed with the user.

## Stack
- **Frontend:** React, Vite, HeroUI, TailwindCSS 4, React Router DOM 7, Lucide React
- **Backend:** Python, FastAPI, SQLModel + SQLAlchemy 2.0, Alembic, SQLite (local), PyJWT, bcrypt
- **ML / Analytics:** scikit-learn (Isolation Forest), NetworkX (graphs), Levenshtein (fuzzy name matching), SHAP (explainability)
- **Design:** Institutional (Navy `#1B2A4A`, Teals, Cyan `#00B4D8`, double-theme, glassmorphism)

## Conventions
- TypeScript strict mode in frontend
- Pydantic v2 validation / SQLModel in backend (strict schemas + validation handlers)
- Clean Architecture: Domain → Services/Use Cases → Infrastructure → Presentation
- Monorepo structure with models in `backend/app/models/` and migrations in `backend/migrations/`
- Python linting and formatting handled strictly via Ruff
- Event loop protection: heavy ML or fuzzy calculations must run in `ProcessPoolExecutor`

## Rules Reference
For detailed architecture and design rules, see `.agents/rules/`.
For a quick index of all rule files, see `.gemini/rules/README.md`.
