import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event as sa_event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.infrastructure.dependencies import get_db
from src.presentation.routers.anomaly import router as anomaly_router
from src.presentation.routers.auth_router import router as auth_router
from src.presentation.routers.auditor_b2g_router import router as auditor_b2g_router
from src.presentation.routers.dashboard_router import router as dashboard_router
from src.presentation.routers.public_router import router as public_router
from src.presentation.routers.sync import router as sync_router

DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(name="db_session")
async def db_session_fixture() -> AsyncSession:
    engine = create_async_engine(DATABASE_URL, echo=False)

    @sa_event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async_session_maker = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_maker() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    test_app = FastAPI()
    test_app.include_router(sync_router, prefix="/api")
    test_app.include_router(anomaly_router, prefix="/api")
    test_app.include_router(public_router, prefix="/api")
    test_app.include_router(auth_router, prefix="/api")
    test_app.include_router(dashboard_router, prefix="/api")
    test_app.include_router(auditor_b2g_router, prefix="/api")
    test_app.dependency_overrides[get_db] = lambda: db_session

    @test_app.get("/health")
    async def health():
        return {"status": "ok"}

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
