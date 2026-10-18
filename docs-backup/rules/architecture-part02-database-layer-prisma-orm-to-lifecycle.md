### 1. Inicialización de la Base de Datos y Sesiones Asíncronas

Para optimizar el rendimiento de la aplicación y garantizar que no se agoten los descriptores de archivos de base de datos durante múltiples llamadas asíncronas concurrentes, se utiliza un motor asíncrono global de SQLAlchemy y un fabricador de sesiones (`async_sessionmaker`).

```python
# src/infrastructure/database.py
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

logger = logging.getLogger("veedoria.infrastructure.database")

DATABASE_URL = "sqlite+aiosqlite:///../database/veedoria.db"

# Crear el motor de base de datos asíncrono
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

# Constructor de sesiones asíncronas
async_session_maker = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Inyector de dependencia para obtener la sesión de base de datos por petición."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

async def verify_db_health() -> bool:
    """Verifica si la base de datos está activa ejecutando una consulta rápida."""
    try:
        async with async_session_maker() as session:
            from sqlmodel import text
            await session.execute(text("SELECT 1;"))
            return True
    except Exception as e:
        logger.error(f"Fallo en la prueba de salud de la base de datos: {e}")
        return False
```

---

### 2. Gestión de Ciclo de Vida de Conexiones (Lifespan Context)

FastAPI utiliza el decorador `@asynccontextmanager` para inicializar recursos al encender el servidor y liberarlos limpiamente al apagarlo. El motor asíncrono de SQLModel se limpia al cerrar la aplicación.

```python
# src/presentation/main.py
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.infrastructure.database import engine

logger = logging.getLogger("veedoria.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP EVENT ---
    logger.info("Inicializando la base de datos asíncrona...")
    # Las tablas se crean vía Alembic en producción, pero en desarrollo local
    # se pueden inicializar aquí si no se desea usar Alembic al principio.
    yield
    
    # --- SHUTDOWN EVENT ---
    logger.info("Cerrando recursos de base de datos...")
    await engine.dispose()
    logger.info("Conexión de base de datos liberada de forma limpia.")

app = FastAPI(lifespan=lifespan)
```

---

### 3. Ruta de Migración: SQLite Local a Supabase PostgreSQL

La base de datos se mantiene en SQLite para desarrollo local ágil, pero SQLModel/SQLAlchemy se diseña para que migrar a Supabase en la nube requiera cambios mínimos:

#### A. Diferencias en la variable de entorno `DATABASE_URL`
*   **SQLite local (Asíncrono)**: `sqlite+aiosqlite:///../database/veedoria.db`
*   **Supabase PostgreSQL (Asíncrono)**: `postgresql+asyncpg://postgres:[password]@db.[supabase-project-id].supabase.co:5432/postgres`

#### B. Gestión de Migraciones con Alembic
Para gestionar el ciclo de vida de la base de datos y evitar la pérdida de tipos nativos (como Enums o UUIDs) en PostgreSQL, se utiliza Alembic en lugar de scripts SQL manuales.

1. **Inicialización de Alembic en el proyecto:**
   ```bash
   poetry run alembic init migrations
   ```

2. **Configurar `migrations/env.py` para usar SQLModel:**
   Se edita el archivo de entorno de Alembic para enlazar los metadatos de SQLModel:
   ```python
   from sqlmodel import SQLModel
   from src.models import User, Institution, Process, Contract, Item, Supplier, Anomaly, AuditLog
   target_metadata = SQLModel.metadata
   ```

3. **Autogenerar una revisión y aplicarla:**
   ```bash
   # Genera el script de migración comparando los modelos de código contra la DB
   poetry run alembic revision --autogenerate -m "Initial schema"
   
   # Aplica la migración a la base de datos activa (SQLite o PostgreSQL)
   poetry run alembic upgrade head
   ```
