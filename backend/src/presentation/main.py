import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse

from src.config import settings
from src.domain.types import ApiErrorResponse
from src.infrastructure.database import engine, init_db
from src.presentation.routers.anomaly import router as anomaly_router
from src.presentation.routers.sync import router as sync_router
from src.presentation.runners import run_detection, run_sync

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("veedoria.app")

scheduler = AsyncIOScheduler()


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: list[dict] | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message, status_code=404)


async def _daily_anomaly_detection() -> None:
    logger.info("Scheduled daily anomaly detection starting...")
    try:
        pid = await run_detection()
        logger.info("Scheduled anomaly detection launched (pid=%d)", pid)
    except RuntimeError as e:
        logger.warning("Scheduled anomaly detection skipped: %s", e)


async def _daily_sync() -> None:
    logger.info("Scheduled daily sync starting...")
    try:
        pid = await run_sync()
        logger.info("Scheduled daily sync launched (pid=%d)", pid)
    except RuntimeError as e:
        logger.warning("Scheduled sync skipped: %s", e)


def _ensure_veedoria_handler() -> None:
    veedoria_logger = logging.getLogger("veedoria")
    veedoria_logger.setLevel(getattr(logging, settings.log_level))
    if not veedoria_logger.handlers:
        _handler = logging.StreamHandler()
        _handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        veedoria_logger.addHandler(_handler)
        veedoria_logger.propagate = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ensure_veedoria_handler()
    logger.info("Initializing database...")
    await init_db()
    scheduler.add_job(
        _daily_sync,
        "cron",
        hour=settings.sync_cron_hour,
        minute=settings.sync_cron_minute,
        id="daily_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        _daily_anomaly_detection,
        "cron",
        hour=6, minute=30,
        id="daily_anomaly_detection",
        replace_existing=True,
    )
    if settings.environment == "development":
        logger.info("APScheduler running in dev mode (daily at %02d:%02d)", settings.sync_cron_hour, settings.sync_cron_minute)
    scheduler.start()
    logger.info("APScheduler started with daily sync at %02d:%02d", settings.sync_cron_hour, settings.sync_cron_minute)
    yield
    scheduler.shutdown()
    logger.info("Shutting down database connections...")
    await engine.dispose()


app = FastAPI(
    title="VeedorIA API",
    description="Premium public procurement monitoring for the Dominican Republic",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(sync_router, prefix="/api")
app.include_router(anomaly_router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/redoc")


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
