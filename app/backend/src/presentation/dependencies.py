from collections.abc import Callable
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.dependencies import get_db
from src.services.anomaly_service import AnomalyService
from src.services.auth_service import AuthDomainError, AuthService
from src.services.auditor_b2g_service import AuditorB2GService
from src.services.dashboard_service import DashboardService
from src.services.public_portal_service import PublicPortalService


def get_anomaly_service(db: AsyncSession = Depends(get_db)) -> AnomalyService:
    return AnomalyService(db=db)


def get_public_portal_service(db: AsyncSession = Depends(get_db)) -> PublicPortalService:
    return PublicPortalService(db=db)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db=db)


def get_auditor_b2g_service(db: AsyncSession = Depends(get_db)) -> AuditorB2GService:
    return AuditorB2GService(db=db)


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(db=db)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


async def get_optional_user(
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict | None:
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    try:
        return await auth_service.get_user_from_token(token)
    except AuthDomainError:
        return None


async def get_current_user(
    authorization: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Autenticación requerida. Inicie sesión con sus credenciales institucionales.",
            },
        )
    try:
        return await auth_service.get_user_from_token(token)
    except AuthDomainError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": exc.message},
        ) from exc


def require_permission(perm_code: str) -> Callable:
    async def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        if perm_code not in current_user.get("permisos", []):
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "FORBIDDEN_INSUFFICIENT_ROLE_OR_PLAN",
                    "message": f"Su rol o el plan actual de su organización no incluye el permiso '{perm_code}'.",
                },
            )
        return current_user

    return _checker