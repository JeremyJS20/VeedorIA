from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.domain.types import ApiResponse
from src.presentation.dependencies import get_auditor_b2g_service, get_current_user
from src.services.auditor_b2g_service import AuditorB2GService

router = APIRouter(prefix="/auditor", tags=["Auditor B2G"])


class DetectionConfigUpdatePayload(BaseModel):
    parameters: dict[str, float] = Field(default_factory=dict)


class IntegrationKeyCreatePayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    system_target: str = Field(default="Power BI / Tablero Institucional", max_length=120)


def _assert_b2g_or_platform_access(current_user: dict) -> None:
    tenant_type = (current_user.get("tenant") or {}).get("tipo")
    role_code = (current_user.get("rol") or {}).get("codigo")
    if tenant_type not in ("GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM") and role_code != "PLATFORM_ADMIN":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN_SEGMENT",
                "message": "Esta herramienta de auditoría está reservada para instituciones públicas y órganos de control.",
            },
        )


@router.get("/processes")
async def get_institutional_processes(
    q: str = Query(default=""),
    status: str = Query(default=""),
    only_with_anomalies: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.list_institutional_processes(
        current_user=current_user,
        q=q,
        status=status,
        only_with_anomalies=only_with_anomalies,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=data)


@router.get("/collusion-network")
async def get_collusion_network(
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.get_collusion_network(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.get("/detection-config")
async def get_detection_config(
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.get_detection_config(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.put("/detection-config")
async def update_detection_config(
    payload: DetectionConfigUpdatePayload,
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    try:
        data = await service.update_detection_config(
            current_user=current_user,
            updates=payload.parameters,
        )
        return ApiResponse(success=True, data=data)
    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail={
                "code": str(exc),
                "message": "Su rol actual es de solo lectura para los umbrales de detección institucional.",
            },
        ) from exc


@router.get("/resolutions")
async def get_audit_resolutions(
    decision: str = Query(default=""),
    q: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.list_audit_resolutions(
        current_user=current_user,
        decision=decision,
        q=q,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=data)


@router.get("/reports/summary")
async def get_compliance_report_summary(
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.get_compliance_report_summary(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.get("/integrations")
async def get_integrations(
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    data = await service.list_integrations(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.post("/integrations/keys")
async def create_integration_key(
    payload: IntegrationKeyCreatePayload,
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    try:
        data = await service.create_integration_key(
            current_user=current_user,
            name=payload.name,
            system_target=payload.system_target,
        )
        return ApiResponse(success=True, data=data)
    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail={
                "code": str(exc),
                "message": "Su rol o plan actual no permite generar nuevas credenciales de integración.",
            },
        ) from exc


@router.delete("/integrations/keys/{key_id}")
async def revoke_integration_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    service: AuditorB2GService = Depends(get_auditor_b2g_service),
):
    _assert_b2g_or_platform_access(current_user)
    try:
        data = await service.revoke_integration_key(current_user=current_user, key_id=key_id)
        return ApiResponse(success=True, data=data)
    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail={
                "code": str(exc),
                "message": "No cuenta con permisos para revocar credenciales de integración.",
            },
        ) from exc
