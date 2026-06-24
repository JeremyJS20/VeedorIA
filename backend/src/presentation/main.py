import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.config import settings
from src.domain.types import ApiErrorResponse
from src.infrastructure.database import engine, init_db
from src.presentation.routers.sync import router as sync_router

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("veedoria.app")


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: list[dict] | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message, status_code=404)


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

app.include_router(sync_router, prefix="/api")


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiErrorResponse(success=False, error=exc.message, details=exc.details).model_dump(),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ApiErrorResponse(success=False, error="Error interno del servidor", details=[]).model_dump(),
    )
