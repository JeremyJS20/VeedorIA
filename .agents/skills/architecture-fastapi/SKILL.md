---
name: Architecture: FastAPI + SQLAlchemy — Python
description: FastAPI's `Depends()` is the backbone of modularity. Chain dependencies for auth, DB sessions, and shared resources.
---

# Architecture: FastAPI + SQLAlchemy — Python

## Stack / Tools

| Tool               | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| FastAPI 0.115+      | Async web framework with auto-generated OpenAPI |
| Pydantic v2         | Data validation, serialization, settings        |
| SQLAlchemy 2.0      | Async ORM with native asyncio support           |
| Alembic             | Database schema migrations                      |
| Uvicorn             | ASGI server (production via Gunicorn worker)     |
| httpx               | Async HTTP client for external API calls        |
| pytest + pytest-asyncio | Async-aware test framework                  |
| pydantic-settings   | Type-safe env/config management                 |

## Setup / Configuration

### `pyproject.toml` (dependencies)
```toml
[project]
name = "my-fastapi-app"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115,<1.0",
    "uvicorn[standard]>=0.30",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.14",
    "pydantic>=2.9",
    "pydantic-settings>=2.6",
    "httpx>=0.28",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3",
    "pytest-asyncio>=0.24",
    "pytest-alembic>=0.11",
    "coverage>=7.6",
    "ruff>=0.8",
    "mypy>=1.13",
]
```

### `alembic.ini` (key entries)
```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname
# Override via env var in production — never commit real credentials
```

## Patterns

### Dependency Injection

FastAPI's `Depends()` is the backbone of modularity. Chain dependencies for auth, DB sessions, and shared resources.

#### DB Session via DI
```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

#### Chained Dependencies
```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await user_repo.get_by_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user

# Usage — fully resolved dependency tree
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await user_service.delete(db, user_id)
    return {"detail": "User deleted"}
```

#### Shared Resources via Lifespan
```python
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import httpx
from fastapi import FastAPI, Request

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: create shared resources
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    # Shutdown: clean up
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)

def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client
```

### Pydantic v2

#### Settings Management with `pydantic-settings`
```python
from functools import lru_cache
from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        case_sensitive=False,
    )

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASS: str = "secret"
    DB_NAME: str = "myapp"
    DB_POOL_MIN: int = 5
    DB_POOL_MAX: int = 20

    @model_validator(mode="after")
    def validate_pool_range(self) -> "Settings":
        if self.DB_POOL_MIN > self.DB_POOL_MAX:
            raise ValueError("DB_POOL_MIN cannot exceed DB_POOL_MAX")
        return self

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

#### Request / Response Schemas
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

class UserCreate(BaseModel):
    email: str = Field(..., max_length=255, examples=["user@example.com"])
    name: str = Field(..., min_length=1, max_length=100)
    role: Literal["user", "admin"] = "user"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    created_at: datetime

    @computed_field
    @property
    def display_name(self) -> str:
        return f"{self.name} ({self.role})"

class UserUpdate(BaseModel):
    email: str | None = None
    name: str | None = None

class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool
```

#### JSON Schema Generation
```python
# Pydantic v2 generates JSON Schema compliant with OpenAPI 3.1
schema = UserCreate.model_json_schema()
# FastAPI uses this automatically for docs — no extra config needed
```

### Async Patterns

#### Decision Criteria: `async def` vs `def`

| Scenario                     | Use            | Reason                                          |
| ---------------------------- | -------------- | ----------------------------------------------- |
| DB queries (asyncpg)         | `async def`    | Non-blocking I/O via async driver               |
| External HTTP calls (httpx)  | `async def`    | Non-blocking network I/O                        |
| CPU-bound computation        | `def`          | FastAPI auto-runs in threadpool                  |
| File I/O (small)             | `def`          | Simple blocking, threadpool handles it           |
| Mixed async + sync library   | `async def`    | Wrap sync calls with `run_in_threadpool`         |

#### Background Tasks
```python
from fastapi import BackgroundTasks

def send_welcome_email(email: str, name: str) -> None:
    """Fire-and-forget — runs after response is sent."""
    # Use sync function; FastAPI runs it in threadpool
    smtp_client.send(to=email, subject="Welcome", body=f"Hello {name}")

@router.post("/users", status_code=201)
async def create_user(
    payload: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.create(db, payload)
    background_tasks.add_task(send_welcome_email, user.email, user.name)
    return UserResponse.model_validate(user)
```

#### Wrapping Sync Code Safely
```python
from fastapi.concurrency import run_in_threadpool

@router.get("/report")
async def generate_report():
    # Offload blocking call to threadpool — keeps event loop free
    pdf_bytes = await run_in_threadpool(sync_pdf_generator.create, data)
    return Response(content=pdf_bytes, media_type="application/pdf")
```

### Alembic Migrations

#### Workflow
```bash
# 1. Initialize (first time only)
alembic init alembic

# 2. Auto-generate from model changes
alembic revision --autogenerate -m "add users table"

# 3. Review the generated file — ALWAYS inspect before committing
# 4. Apply
alembic upgrade head

# 5. Rollback
alembic downgrade -1

# 6. Check for un-generated model drift (CI gate)
alembic check
```

#### Async `env.py`
```python
# alembic/env.py
import asyncio
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings
from app.db.base import Base  # Import all models here

settings = get_settings()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()

asyncio.run(run_migrations_online())
```

#### Manual Migration (data migration)
```python
"""backfill display names

Revision ID: a1b2c3d4
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Data migration — cannot be auto-generated
    op.execute(
        "UPDATE users SET display_name = name WHERE display_name IS NULL"
    )

def downgrade():
    op.execute(
        "UPDATE users SET display_name = NULL"
    )
```

### Middleware & Error Handling

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(lifespan=lifespan)

# Order matters — first added = outermost wrapper
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
```

## Anti-patterns

### ❌ BAD: Sync blocking call inside async endpoint
```python
@router.get("/data")
async def get_data():
    import requests  # ← BLOCKS the event loop!
    response = requests.get("https://api.example.com/data")
    return response.json()
```

### ✅ GOOD: Use async HTTP client
```python
@router.get("/data")
async def get_data(client: httpx.AsyncClient = Depends(get_http_client)):
    response = await client.get("https://api.example.com/data")
    return response.json()
```

---

### ❌ BAD: Passing raw dicts between layers
```python
@router.post("/users")
async def create_user(request: Request):
    body = await request.json()  # ← No validation, no schema
    await db.execute(insert(User).values(**body))
```

### ✅ GOOD: Use Pydantic models for validation
```python
@router.post("/users", response_model=UserResponse)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Pydantic validates input automatically; typed and documented
    user = await user_service.create(db, payload)
    return UserResponse.model_validate(user)
```

---

### ❌ BAD: Global DB session shared across requests
```python
# module-level session — shared state, race conditions, connection leaks
db = AsyncSessionLocal()

@router.get("/users")
async def list_users():
    return await db.execute(select(User))  # ← Never closed, never rolled back
```

### ✅ GOOD: DI-managed session per request
```python
@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    # Each request gets its own session; auto-committed/rolled-back
    result = await db.execute(select(User))
    return result.scalars().all()
```

---

### ❌ BAD: Business logic in route handlers
```python
@router.post("/orders")
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    # ← 50 lines of inventory checks, pricing, discounts here
    inventory = await db.execute(select(Product).where(...))
    if inventory.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Out of stock")
    total = payload.quantity * inventory.price * 0.9  # discount
    order = Order(total=total, ...)
    db.add(order)
```

### ✅ GOOD: Delegate to service layer
```python
@router.post("/orders", response_model=OrderResponse)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    order = await order_service.create(db, payload)  # ← Thin handler
    return OrderResponse.model_validate(order)
```

---

### ❌ BAD: `allow_origins=["*"]` with credentials
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True)
# ← Browsers reject this combination; also a security risk
```

### ✅ GOOD: Explicit origin list per environment
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com", "https://staging.example.com"],
    allow_credentials=True,
)
```

## Project Structure

```
my-fastapi-app/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory, lifespan
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── users.py     # Thin route handlers
│   │   │   │   ├── orders.py
│   │   │   │   └── health.py
│   │   │   └── dependencies.py  # Route-level DI (pagination, filters)
│   │   └── middleware/
│   │       ├── cors.py
│   │       ├── logging.py
│   │       └── request_id.py
│   ├── core/
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── security.py          # JWT, hashing, OAuth2
│   │   └── exceptions.py        # AppException + handlers
│   ├── models/
│   │   ├── domain/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   └── order.py
│   │   └── schemas/             # Pydantic request/response
│   │       ├── user.py
│   │       └── order.py
│   ├── services/                # Business logic (pure, testable)
│   │   ├── user_service.py
│   │   └── order_service.py
│   ├── repositories/            # Data access (DB queries only)
│   │   ├── user_repo.py
│   │   └── order_repo.py
│   └── db/
│       ├── session.py           # Engine + async session factory
│       └── base.py              # DeclarativeBase, import all models
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py              # Fixtures: test DB, client, overrides
│   ├── test_users.py
│   └── test_orders.py
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── .github/
    └── workflows/
        └── ci.yml
```

## Coverage / Targets

| Metric               | Target   | Tool                     |
| --------------------- | -------- | ------------------------ |
| Line coverage         | ≥ 85%    | `coverage` + `pytest`    |
| Branch coverage       | ≥ 75%    | `coverage`               |
| Type coverage         | ≥ 90%    | `mypy --strict`          |
| Migration consistency | 100%     | `pytest-alembic`         |
| Lint pass rate        | 100%     | `ruff check`             |
| Schema drift          | 0        | `alembic check` in CI    |

## CI Integration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          pip install uv
          uv pip install --system -e ".[dev]"

      - name: Lint
        run: ruff check app/ tests/

      - name: Type check
        run: mypy app/ --strict

      - name: Check Alembic migrations
        run: alembic check
        env:
          APP_DB_HOST: localhost
          APP_DB_USER: test
          APP_DB_PASS: test
          APP_DB_NAME: test_db

      - name: Run migrations
        run: alembic upgrade head
        env:
          APP_DB_HOST: localhost
          APP_DB_USER: test
          APP_DB_PASS: test
          APP_DB_NAME: test_db

      - name: Run tests
        run: pytest --cov=app --cov-report=xml --cov-fail-under=85
        env:
          APP_DB_HOST: localhost
          APP_DB_USER: test
          APP_DB_PASS: test
          APP_DB_NAME: test_db

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage.xml
```

## Rules

1. **Use `async def` for all I/O-bound endpoints** — DB queries, HTTP calls, and file operations MUST use async-compatible libraries (`asyncpg`, `httpx`, `aiofiles`).
2. **Never block the event loop** — wrap unavoidable sync calls with `run_in_threadpool`; use a task queue (Celery, ARQ) for CPU-heavy work.
3. **One Pydantic schema per concern** — separate `Create`, `Update`, and `Response` schemas; never reuse a single model for input and output.
4. **Inject dependencies via `Depends()`** — DB sessions, auth, config, and shared HTTP clients MUST be injected, never imported as module globals.
5. **Keep route handlers thin** — max 10 lines; delegate all business logic to the service layer and all DB queries to the repository layer.
6. **Review every auto-generated migration** — `alembic revision --autogenerate` output MUST be inspected before commit; run `alembic check` in CI to catch model/schema drift.
7. **Use `pydantic-settings` for configuration** — all environment variables loaded via `BaseSettings` with `@lru_cache`; never use raw `os.getenv()`.
8. **Validate at the boundary** — Pydantic models enforce all input validation; services and repositories assume pre-validated data.
9. **Test with dependency overrides** — use `app.dependency_overrides[get_db] = get_test_db` for isolated, repeatable tests against a real PostgreSQL instance.
10. **Run migrations in CI, not at startup** — `alembic upgrade head` executes in the pipeline; the application process MUST NOT run migrations on boot.

