# Guía de Arquitectura: Python + FastAPI (Producción)

Este documento establece los estándares, lineamientos de diseño y directrices técnicas de nivel de producción para el desarrollo del backend utilizando **Python 3.11+**, **FastAPI** y **SQLModel + SQLAlchemy 2.0**.

---

## 1. Filosofía Arquitectónica y Principios de Diseño

El backend se rige bajo los principios de **Clean Architecture** (Arquitectura Limpia) adaptados a la modularidad y velocidad de FastAPI. El objetivo principal es mantener el núcleo del negocio (modelos matemáticos, reglas de fraude y procesos de compras) aislado de tecnologías externas (framework web, bases de datos y clientes HTTP).

```
 ┌─────────────────────────────────────────────────────────────┐
 │ Presentation Layer (API Routers, Middleware, FastAPI Entry) │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (Inyecta dependencias)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  Services/Use Cases Layer (ML Engines, Business Services)   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (Utiliza contratos/esquemas)
                                ▼
  ┌─────────────────────────────────────────────────────────────┐
  │   Infrastructure Layer (SQLModel sessions, DGCP client)     │
  └──────────────────────────────┬──────────────────────────────┘
                                │ (Persistencia / Entrada)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │       Domain Layer (Pydantic schemas, Pure Rules, Types)    │
 └─────────────────────────────┘
```

### Principios Fundamentales
*   **Separación de Responsabilidades (SoC):** Cada módulo contiene sus rutas, lógica de servicios y validaciones. La infraestructura se separa a nivel de directorio.
*   **Aislamiento del Dominio:** Los modelos matemáticos (Isolation Forest) e índices (Indice Herfindahl-Hirschman) se computan usando estructuras puras de datos en el dominio. No dependen de llamadas a base de datos dentro de sus algoritmos.
*   **Inmutabilidad y Auditoría:** Los registros de auditoría y transacciones resueltas se escriben bajo un modelo "Append-Only" (solo inserciones), garantizando trazabilidad total.
*   **Validación Estricta:** Todas las entradas y salidas de la API pasan por esquemas de validación de Pydantic v2 en el extremo del sistema.
*   **Tipado Estricto (PEP 484):** Todo método debe declarar tipos para sus argumentos y retornos. No se permite el tipo implícito `Any` sin justificación explícita.

---

## 2. Pila Tecnológica Detallada (Tech Stack)

### Backend Core

| Componente | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Runtime** | Python | `3.11+` | Mejoras en velocidad, sintaxis moderna de tipos y optimización asíncrona de `asyncio`. |
| **Framework** | FastAPI | `^0.110.0` | Alto rendimiento en peticiones concurrentes, tipado nativo y generación automática de OpenAPI en base a Pydantic. |
| **Servidor ASGI** | Uvicorn | `^0.28.0` | Servidor rápido de ASGI basado en uvloop para procesar bucles de eventos no bloqueantes. |
| **ORM / DB Layer**| SQLModel | `^0.0.22` | Combina Pydantic con SQLAlchemy 2.0. Permite usar un solo modelo para esquema de API y persistencia asíncrona. |
| **Validación** | Pydantic v2 | `^2.6.4` | Motor escrito en Rust que procesa validaciones hasta 20 veces más rápido que la versión 1.x. |
| **Configurador** | Pydantic Settings| `^2.2.1` | Manejo y parseo estricto de variables de entorno al iniciar la app. |
| **Seguridad** | PyJWT | `^2.9.0` | Creación, firma y verificación de JSON Web Tokens (JWT) seguros para sesiones. |
| **Cifrado** | bcrypt | `^4.2.0` | Hashing seguro directo de contraseñas locales en SQLite/PostgreSQL sin dependencias obsoletas. |

### Procesamiento de Datos e Inteligencia Artificial (ML/AI)

| Componente | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Cálculo Numérico** | NumPy & Pandas | `^2.0.0` / `^2.2.0` | Manipulación de vectores de precios unitarios e ingestión masiva de la API DGCP. |
| **Aprendizaje ML** | scikit-learn | `^1.4.1` | Algoritmo Isolation Forest para la clasificación no supervisada de anomalías de mercado. |
| **Estructuras de Red** | NetworkX | `^3.2.1` | Modelado y análisis de grafos para la identificación de anillos de colusión entre proveedores. |
| **Fuzzy Matching** | python-Levenshtein| `^0.25.0` | Comparativa rápida por distancia de edición sobre cadenas de nombres y direcciones físicas. |
| **Explicabilidad** | SHAP | `^0.45.0` | Atribución de características para desglosar el veredicto de la IA a los auditores gubernamentales. |

---

## 3. Estructura de Directorios del Monorepo Backend

El backend se organiza de forma que las dependencias fluyan hacia adentro. Los routers de la presentación llaman a los servicios, los servicios llaman a la infraestructura y todos comparten los modelos de dominio.

```text
backend-app/
│
├── src/
│   ├── models/               # Clases de SQLModel (API + Tablas físicas relacionales)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── contracts.py
│   │   ├── suppliers.py
│   │   └── anomalies.py
│   │
│   ├── domain/               # Entidades lógicas puras y reglas del negocio
│   │   ├── __init__.py
│   │   ├── types.py          # Envolturas de API y definiciones comunes
│   │   └── rules.py          # Algoritmos de cálculo de red flags (fraccionamiento, etc.)
│   │
│   ├── services/             # Orquestadores de procesos y lógica de aplicación
│   │   ├── __init__.py
│   │   ├── auth_service.py   # Registro, login y validación de tokens
│   │   ├── sync_service.py   # Ingestión asíncrona de datos DGCP
│   │   ├── anomaly_service.py# Isolation Forest, SHAP e IHH
│   │   └── network_service.py# Construcción de redes de colusión relacional
│   │
│   ├── infrastructure/       # Conectores y llamadas externas (DB, HTTP Clients)
│   │   ├── __init__.py
│   │   ├── database.py       # Configuración del motor asíncrono y sesión de SQLModel/SQLAlchemy
│   │   ├── repository.py     # Patrón repositorio para abstracción de consultas
│   │   └── dgcp_client.py    # Cliente HTTP asíncrono para la API de la DGCP
│   │
│   ├── presentation/         # Protocolos de transporte (FastAPI Routers)
│   │   ├── __init__.py
│   │   ├── main.py           # Inicialización y Lifespan de la app
│   │   ├── routers/          # Controladores modulares expuestos
│   │   │   ├── auth.py
│   │   │   ├── contracts.py
│   │   │   └── anomalies.py
│   │   ├── middleware/       # Interceptores (CORS, logs, excepciones)
│   │   │   ├── exceptions.py
│   │   │   └── logging.py
│   │   └── dependencies.py   # Funciones inyectoras para FastAPI Depends (db session, etc.)
│   │
│   ├── migrations/           # Historial de versiones de base de datos generado por Alembic
│   ├── config.py             # Clase Pydantic Settings para configuración
│   └── utils/                # Utilidades comunes (cifrado, fechas)
│       └── security.py
│
├── tests/                    # Banco de pruebas (Pytest)
│   ├── __init__.py
│   ├── conftest.py           # Fixtures asíncronas y mocks
│   ├── unit/                 # Pruebas unitarias de servicios y reglas
│   │   ├── test_rules.py
│   │   └── test_ml_anomalies.py
│   └── integration/          # Pruebas de integración de la API
│       ├── test_auth_flow.py
│       └── test_endpoints.py
│
├── pyproject.toml            # Configuración de dependencias de Poetry y Ruff
├── poetry.lock               # Archivo de bloqueo de versiones exactas
└── README.md                 # Documentación de instalación local
```

---

## 4. Estándar de Configuración Global (`pyproject.toml`)

Administramos las dependencias de Python y configuramos las herramientas de análisis estático dentro del archivo unificado `pyproject.toml`.

```toml
[tool.poetry]
name = "veedoria-backend"
version = "0.1.0"
description = "Backend analítico para el monitoreo de contrataciones públicas de la República Dominicana"
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
pytest-cov = "^4.1.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
# Habilitar reglas estandarizadas de calidad de código
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # pyflakes
    "I",     # isort (orden de imports)
    "B",     # flake8-bugbear (errores comunes)
    "C4",    # flake8-comprehensions
    "UP",    # pyupgrade (sintaxis moderna)
    "ASYNC", # flake8-async (buenas prácticas asíncronas)
    "S",     # flake8-bandit (escaneo de seguridad)
    "T20",   # flake8-print (prohibir prints)
]
ignore = [
    "S101",  # Permitir asserts en pruebas
    "S105",  # Permitir strings duros simulando tokens en mocks
]

[tool.ruff.lint.isort]
combine-as-imports = true
known-first-party = ["src"]
section-order = ["future", "standard-library", "third-party", "first-party", "local-folder"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
filterwarnings = ["ignore::DeprecationWarning"]
