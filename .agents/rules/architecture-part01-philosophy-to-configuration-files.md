# Arquitectura de Backend: Python + FastAPI + SQLModel

> Stack: Python 3.11+ · FastAPI · SQLModel (SQLAlchemy 2.0) · SQLite (Local) / PostgreSQL (Supabase) · Alembic · Ruff

---

## 1. Filosofía Arquitectónica

| Principio | Significado |
|---|---|
| **Arquitectura Limpia** | Separación estricta en capas: Domain → Services/Use Cases → Infrastructure → Presentation. Las capas internas nunca conocen las externas. |
| **Separación Modular** | División en base a contextos delimitados (ej. `auth`, `contracts`, `anomalies`). Cada módulo agrupa sus propios modelos y lógica analítica. |
| **Confianza Cero (Zero Trust)** | Validación estricta en el extremo de la API mediante modelos SQLModel/Pydantic v2. Cifrado irreversible en almacenamiento. |
| **Bucle de Eventos Asíncrono** | I/O asíncrono no bloqueante en todas las llamadas de base de datos e integraciones externas. |
| **Inyección de Dependencias** | Uso extensivo del motor de inyección `Depends` de FastAPI con anotaciones explícitas de tipos. |

---

## 2. Pila Tecnológica (Tech Stack)

### Core Backend

| Rol | Tecnología | Por qué |
|---|---|---|
| Lenguaje | **Python 3.11+** | Anotaciones de tipos estáticas nativas y optimizaciones del compilador. |
| Framework | **FastAPI** | Generación de OpenAPI basada en tipos, rendimiento C-speed y DI nativo. |
| Servidor ASGI | **Uvicorn** | Servidor web asíncrono para Python basado en `uvloop`. |
| ORM | **SQLModel** | Combina Pydantic con SQLAlchemy 2.0. Permite usar un solo modelo para esquema de API y persistencia. |
| Migraciones | **Alembic** | Control de versiones nativo para cambios de esquema relacionales. |
| Validación | **Pydantic v2** | Serialización y validación de tipos compilada en Rust de alta velocidad. |

### Análisis e Inteligencia Artificial

| Rol | Tecnología | Por qué |
|---|---|---|
| Modelos de ML | **scikit-learn** | Algoritmo Isolation Forest para la detección de sobreprecios unitarios. |
| Redes de Grafos | **NetworkX** | Modelado de relaciones relacionales de socios para identificar colusión. |
| Fuzzy Matching | **python-Levenshtein** | Cálculo de distancia de edición para detectar razones sociales y direcciones similares. |
| Explicabilidad | **SHAP** | Atribución matemática para explicar en lenguaje natural las alertas de ML. |

### Herramientas de Desarrollo y Calidad (DevOps)

| Rol | Tecnología | Por qué |
|---|---|---|
| Linter & Formatter| **Ruff** | Herramienta ultrarrápida escrita en Rust que reemplaza a Black, Flake8 e isort. |
| Gestor de Entornos| **Poetry** | Administrador de paquetes determinista y entornos virtuales aislados. |

---

## 3. Estructura del Proyecto Monorepo (Backend)

```text
backend-app/
│
├── src/
│   ├── models/               # Clases de SQLModel (API + Tablas físicas relacionales)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── contracts.py
│   │   └── anomalies.py
│   │
│   ├── domain/               # Entidades lógicas puras y reglas del negocio
│   │   ├── types.py          # Envolturas genéricas de respuesta API y ApiResponse[T]
│   │   └── rules.py          # Algoritmos de cálculo de red flags (fraccionamiento, etc.)
│   │
│   ├── services/             # Reglas del negocio, entrenamiento de ML y ETL
│   │   ├── auth_service.py
│   │   ├── sync_service.py
│   │   └── anomaly_service.py
│   │
│   ├── infrastructure/       # Conectores y llamadas externas (DB, APIs)
│   │   ├── database.py       # Configuración del motor asíncrono y sesión de SQLModel
│   │   └── dgcp_client.py    # Cliente HTTP asíncrono de la DGCP
│   │
│   ├── presentation/         # Controladores HTTP expuestos (FastAPI)
│   │   ├── routers/
│   │   ├── middleware/
│   │   └── main.py           # Entry point principal del servidor web
│   │
│   └── config.py             # Clase Pydantic Settings de variables de entorno
│
├── migrations/               # Historial de versiones de base de datos generado por Alembic
├── alembic.ini               # Archivo de configuración de Alembic
├── tests/                    # Pruebas asíncronas con pytest
├── pyproject.toml            # Dependencias y configuración de Ruff
└── README.md
```

---

## 4. Archivos de Configuración de Arranque

### 4.1 `pyproject.toml`
```toml
[tool.poetry]
name = "veedoria-backend"
version = "0.1.0"
description = "FastAPI backend for VeedorIA procurement monitoring"
authors = ["Jerermy Michel Solano Frías <jsjer@unapec.edu.do>"]
readme = "README.md"
packages = [{include = "src"}]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
uvicorn = {extras = ["standard"], version = "^0.28.0"}
pydantic = "^2.6.4"
pydantic-settings = "^2.2.1"
sqlmodel = "^0.0.22"
alembic = "^1.13.0"
scikit-learn = "^1.4.1"
numpy = "^2.0.0"
pandas = "^2.2.0"
networkx = "^3.2.1"
python-levenshtein = "^0.25.0"
shap = "^0.45.0"
pyjwt = "^2.9.0"
bcrypt = "^4.2.0"
httpx = "^0.27.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.1.1"
pytest-asyncio = "^0.23.5"
ruff = "^0.3.2"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "C4", "UP", "ASYNC", "S", "T20"]
ignore = ["S101"]

[tool.ruff.lint.isort]
combine-as-imports = true
known-first-party = ["src"]
```

### 4.2 `.env.example`
```bash
# ── Servidor ──
PORT=3001
ENVIRONMENT=development
LOG_LEVEL=INFO

# ── Base de Datos (SQLite Local por defecto) ──
DATABASE_URL="sqlite+aiosqlite:///../database/veedoria.db"

# ── Autenticación (Clave de 32 caracteres mínimo) ──
JWT_SECRET="cambiar_esto_por_un_secreto_seguro_y_largo_en_produccion"
JWT_ALGORITHM="HS256"

# ── API Gubernamental de la DGCP ──
DGCP_API_BASE_URL="https://datosabiertos.dgcp.gob.do/api-dgcp/v1"
```
