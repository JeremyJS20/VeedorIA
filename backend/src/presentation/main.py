import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.infrastructure.database import engine, init_db

logger = logging.getLogger("veedoria.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    yield
    logger.info("Shutting down database connections...")
    await engine.dispose()


app = FastAPI(
    title="VeedorIA API",
    description="Premium public procurement monitoring for the Dominican Republic",
    version="0.1.0",
    lifespan=lifespan,
)
