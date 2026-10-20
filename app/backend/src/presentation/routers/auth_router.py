from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.domain.types import ApiResponse
from src.presentation.dependencies import (
    get_auth_service,
    get_current_user,
    require_permission,
)
from src.services.auth_service import AuthDomainError, AuthService

router = APIRouter(tags=["auth-rbac"])



class RegisterAccountRequest(BaseModel):
    modo: str = Field(default="INVITATION")
    codigo_invitacion: str | None = None
    nombre: str = Field(..., min_length=2)
    correo: str = Field(..., min_length=3)
    cargo: str | None = None
    password: str = Field(..., min_length=8)
    empresa_nombre: str | None = None
    empresa_rpe: str | None = None
    empresa_rnc: str | None = None
    plan_tier: str | None = "B2B_PYME"


class LoginRequest(BaseModel):
    correo: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    correo: str = Field(..., min_length=3)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    nueva_password: str = Field(..., min_length=8)
    confirmar_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    password_actual: str = Field(..., min_length=1)
    nueva_password: str = Field(..., min_length=8)
    confirmar_password: str = Field(..., min_length=8)


class CreateUserRequest(BaseModel):
    nombre: str = Field(..., min_length=2)
    correo: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)
    role_id: int
    tenant_id: int | None = None
    cargo: str | None = None


class UpdateUserRequest(BaseModel):
    nombre: str | None = None
    cargo: str | None = None
    role_id: int | None = None
    tenant_id: int | None = None
    estado: str | None = None


class CreateTenantRequest(BaseModel):
    codigo: str | None = None
    nombre: str = Field(..., min_length=3)
    tipo: str = "GOV_INSTITUTION"
    plan_tier: str = "B2G_BASIC"
    institution_id: int | None = None
    supplier_rpe: str | None = None


class UpdateTenantRequest(BaseModel):
    nombre: str | None = None
    plan_tier: str | None = None
    estado: str | None = None
    institution_id: int | None = None
    supplier_rpe: str | None = None


def _raise_http(exc: AuthDomainError) -> None:
    raise HTTPException(
        status_code=exc.status_code,
        detail={"code": exc.code, "message": exc.message},
    ) from exc


@router.post("/auth/login", response_model=ApiResponse[dict])
async def login_endpoint(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.login(correo=body.correo, password=body.password)
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.get("/auth/me", response_model=ApiResponse[dict])
async def me_endpoint(
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[dict]:
    return ApiResponse(data=current_user)


@router.post("/auth/logout", response_model=ApiResponse[dict])
async def logout_endpoint() -> ApiResponse[dict]:
    return ApiResponse(data={"success": True, "message": "Sesión cerrada correctamente."})


@router.post("/auth/forgot-password", response_model=ApiResponse[dict])
async def forgot_password_endpoint(
    body: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.request_password_reset(correo=body.correo)
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.post("/auth/reset-password", response_model=ApiResponse[dict])
async def reset_password_endpoint(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.reset_password(
            raw_token=body.token,
            nueva_password=body.nueva_password,
            confirmar_password=body.confirmar_password,
        )
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.put("/auth/change-password", response_model=ApiResponse[dict])
async def change_password_endpoint(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.change_password(
            user_id=int(current_user["id"]),
            password_actual=body.password_actual,
            nueva_password=body.nueva_password,
            confirmar_password=body.confirmar_password,
        )
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.get("/usuarios", response_model=ApiResponse[list[dict]])
async def list_users_endpoint(
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[list[dict]]:
    data = await service.list_users(current_user=current_user)
    return ApiResponse(data=data)


@router.post("/usuarios", response_model=ApiResponse[dict])
async def create_user_endpoint(
    body: CreateUserRequest,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.create_user(current_user=current_user, data=body.model_dump())
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.put("/usuarios/{user_id}", response_model=ApiResponse[dict])
async def update_user_endpoint(
    user_id: int,
    body: UpdateUserRequest,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.update_user(
            current_user=current_user,
            target_user_id=user_id,
            data=body.model_dump(exclude_unset=True),
        )
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.post("/usuarios/{user_id}/unlock", response_model=ApiResponse[dict])
async def unlock_user_endpoint(
    user_id: int,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.unlock_user(current_user=current_user, target_user_id=user_id)
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.post("/usuarios/{user_id}/reset-link", response_model=ApiResponse[dict])
async def manual_reset_link_endpoint(
    user_id: int,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.generate_manual_reset_link(current_user=current_user, target_user_id=user_id)
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.get("/tenants/directory-search", response_model=ApiResponse[list[dict]])
async def directory_search_endpoint(
    tipo: str = "GOV_INSTITUTION",
    q: str = "",
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[list[dict]]:
    data = await service.search_directory(tipo=tipo, q=q)
    return ApiResponse(data=data)


@router.get("/tenants", response_model=ApiResponse[list[dict]])
async def list_tenants_endpoint(
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[list[dict]]:
    data = await service.list_tenants(current_user=current_user)
    return ApiResponse(data=data)


@router.post("/tenants", response_model=ApiResponse[dict])
async def create_tenant_endpoint(
    body: CreateTenantRequest,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.create_tenant(current_user=current_user, data=body.model_dump())
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.put("/tenants/{tenant_id}", response_model=ApiResponse[dict])
async def update_tenant_endpoint(
    tenant_id: int,
    body: UpdateTenantRequest,
    current_user: dict = Depends(require_permission("USER_ADMIN")),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.update_tenant(
            current_user=current_user,
            tenant_id=tenant_id,
            data=body.model_dump(exclude_unset=True),
        )
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.get("/roles", response_model=ApiResponse[dict])
async def get_roles_matrix_endpoint(
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    if not (
        "ROLE_VIEW" in current_user.get("permisos", [])
        or "USER_ADMIN" in current_user.get("permisos", [])
    ):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
                "message": "Acceso denegado: requiere privilegios administrativos.",
            },
        )
    data = await service.get_roles_and_permissions_matrix()
    return ApiResponse(data=data)


@router.get("/auth/invitation/{code}", response_model=ApiResponse[dict])
async def get_invitation_info_endpoint(
    code: str,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.get_invitation_info(code=code)
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)


@router.get("/auth/suppliers-search", response_model=ApiResponse[list[dict]])
async def search_public_suppliers_endpoint(
    q: str = "",
    limit: int = 12,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[list[dict]]:
    data = await service.search_public_suppliers(q=q, limit=limit)
    return ApiResponse(data=data)


@router.post("/auth/register", response_model=ApiResponse[dict], status_code=201)
async def register_account_endpoint(
    body: RegisterAccountRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    try:
        data = await service.register_account(data=body.model_dump())
        return ApiResponse(data=data)
    except AuthDomainError as exc:
        _raise_http(exc)

