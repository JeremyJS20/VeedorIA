from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.dependencies import get_db
from src.services.anomaly_service import AnomalyService
from src.services.public_portal_service import PublicPortalService


def get_anomaly_service(db: AsyncSession = Depends(get_db)) -> AnomalyService:
    return AnomalyService(db=db)


def get_public_portal_service(db: AsyncSession = Depends(get_db)) -> PublicPortalService:
    return PublicPortalService(db=db)