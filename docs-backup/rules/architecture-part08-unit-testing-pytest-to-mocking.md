### 1. Configuración de Pruebas con Base de Datos SQLite en Memoria

Para asegurar la velocidad de ejecución, consistencia y evitar escrituras indeseadas en la base de datos de desarrollo, se utiliza una base de datos SQLite en memoria (`:memory:`) para el entorno de pruebas. Esto permite probar consultas ORM reales con SQLModel sin el acoplamiento y fragilidad de los mocks.

---

### 2. Archivo de Fixtures Globales (`tests/conftest.py`)

Definimos las fixtures de `pytest` para inicializar el esquema de base de datos en memoria antes de cada test y limpiar las tablas al terminar.

```python
# tests/conftest.py
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from src.presentation.main import app
from src.presentation.dependencies import get_db

DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(name="db_session")
async def db_session_fixture() -> AsyncGenerator[AsyncSession, None]:
    """Fixture que crea una base de datos SQLite en memoria para cada test y yields una sesión."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Crear tablas en la base de datos temporal
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    async_session_maker = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
        
    # Limpiar tablas al terminar la ejecución de la prueba
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        
    await engine.dispose()

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Cliente HTTP de pruebas que anula la base de datos real con la in-memory DB."""
    # Sobrescribimos el inyector de base de datos de FastAPI
    app.dependency_overrides[get_db] = lambda: db_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
        
    # Limpiamos las dependencias modificadas al finalizar cada test
    app.dependency_overrides.clear()
```

---

### 3. Escritura de Pruebas Asíncronas

Las pruebas de integración y de endpoints deben marcarse con el decorador `@pytest.mark.asyncio`, utilizando aserciones sobre los códigos de estado HTTP y la estructura de respuestas estándar (`ApiResponse`).

#### A. Pruebas de Rutas e Integración (`tests/integration/test_endpoints.py`)
```python
# tests/integration/test_endpoints.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.anomalies import Anomaly

@pytest.mark.asyncio
async def test_get_unresolved_anomalies_endpoint(client: AsyncClient, db_session: AsyncSession):
    # 1. Insertar datos de prueba reales en la base de datos en memoria
    anomaly = Anomaly(
        id="anomaly-uuid-123",
        ocid="ocds-6550wx-proc-99",
        anomaly_score=0.78,
        red_flags="FRAC-01",
        description="Fraccionamiento sospechoso de licitación",
        resolved=False
    )
    db_session.add(anomaly)
    await db_session.commit()

    # 2. Ejecutar petición HTTP
    response = await client.get("/api/anomalies/unresolved?limit=10&min_score=0.5")

    # 3. Validar respuestas
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert len(json_data["data"]) == 1
    assert json_data["data"][0]["id"] == "anomaly-uuid-123"
    assert json_data["data"][0]["anomaly_score"] == 0.78
```

#### B. Pruebas Unitarias de Reglas de Negocio (`tests/unit/test_rules.py`)
```python
# tests/unit/test_rules.py
import pytest
from src.domain.rules import calculate_ihh

def test_calculate_ihh_concentration():
    """Valida el cálculo del Índice de Herfindahl-Hirschman (concentración de mercado)."""
    # 1. Dos proveedores con 50% de participación cada uno
    shares = [0.5, 0.5]
    # IHH = 0.5^2 + 0.5^2 = 0.25 + 0.25 = 0.50 (o 5000 en escala 10,000)
    ihh_score = calculate_ihh(shares)
    assert ihh_score == 0.50

    # 2. Monopolio absoluto (100% de participación)
    monopoly_shares = [1.0]
    assert calculate_ihh(monopoly_shares) == 1.0
```
