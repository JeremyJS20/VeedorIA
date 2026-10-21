from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.domain.types import ApiResponse
from src.presentation.dependencies import get_b2b_suite_service, get_current_user
from src.services.b2b_suite_service import B2BSuiteService

router = APIRouter(prefix="/b2b", tags=["B2B Suite"])


class BidUpsertPayload(BaseModel):
    process_id: int
    process_code: str | None = None
    title: str | None = None
    institution_name: str | None = None
    unspsc_family: str | None = "7214"
    stage: str = Field(default="GUARDADA")
    priority: str = Field(default="MEDIA")
    reference_amount_dop: float = Field(default=0.0)
    bid_amount_dop: float = Field(default=0.0)
    notes: str = Field(default="")


class PriceSimulatorPayload(BaseModel):
    unspsc_family: str = Field(default="7214")
    proposed_unit_price_dop: float = Field(..., gt=0)
    quantity: float = Field(default=1.0, gt=0)
    institution_id: int | None = None


class SectorsUpdatePayload(BaseModel):
    monitored_families: list[str] = Field(default_factory=list)


class SubscriptionPlanUpdatePayload(BaseModel):
    target_plan_tier: str
    billing_cycle: str = "ANUAL"


def _assert_b2b_access(current_user: dict) -> None:
    tenant_type = (current_user.get("tenant") or {}).get("tipo")
    role_code = (current_user.get("rol") or {}).get("codigo")
    permisos = current_user.get("permisos") or []
    if (
        tenant_type not in ("B2B_SUPPLIER", "GOV_OVERSIGHT", "PLATFORM")
        and role_code != "PLATFORM_ADMIN"
        and "B2B_ANALYTICS" not in permisos
    ):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN_SEGMENT",
                "message": "Esta herramienta de inteligencia comercial está reservada para proveedores del Estado y administradores.",
            },
        )


# REQ-001: Radar de Oportunidades (#23)
@router.get("/opportunities")
async def get_opportunities(
    unspsc_family: str | None = Query(default=None),
    institution_id: int | None = Query(default=None),
    modality: str | None = Query(default=None),
    q: str | None = Query(default=None),
    only_high_affinity: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.list_opportunities(
        current_user=current_user,
        unspsc_family=unspsc_family,
        institution_id=institution_id,
        modality=modality,
        q=q,
        only_high_affinity=only_high_affinity,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=data)


# REQ-002: Seguimiento de Mis Licitaciones (#24)
@router.get("/bids")
async def get_bids(
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.list_bids(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.post("/bids")
async def create_or_update_bid(
    payload: BidUpsertPayload,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.upsert_bid(current_user=current_user, payload=payload.model_dump())
    return ApiResponse(success=True, data=data)


@router.put("/bids/{bid_id}")
async def update_bid(
    bid_id: str,
    payload: BidUpsertPayload,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.upsert_bid(current_user=current_user, payload=payload.model_dump())
    return ApiResponse(success=True, data=data)


@router.delete("/bids/{bid_id}")
async def delete_bid(
    bid_id: str,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.delete_bid(current_user=current_user, bid_id=bid_id)
    return ApiResponse(success=True, data=data)


# REQ-003: Ficha de Competidor (#25)
@router.get("/competitors")
async def get_competitors_list(
    q: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.list_competitors(current_user=current_user, q=q)
    return ApiResponse(success=True, data=data)


@router.get("/competitors/{rnc}")
async def get_competitor_profile(
    rnc: str,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.get_competitor_profile(current_user=current_user, rnc=rnc)
    return ApiResponse(success=True, data=data)


# REQ-004: Simulador de Precios (#26)
@router.get("/price-simulator/catalog")
async def get_simulator_catalog(
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.get_simulator_catalog(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.post("/price-simulator")
async def simulate_offer_price(
    payload: PriceSimulatorPayload,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.simulate_price(current_user=current_user, payload=payload.model_dump())
    return ApiResponse(success=True, data=data)


# REQ-005: Explorador de Sectores (#27)
@router.get("/sectors")
async def get_sectors(
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.list_sectors(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.put("/sectors")
async def update_monitored_sectors(
    payload: SectorsUpdatePayload,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    _assert_b2b_access(current_user)
    data = await service.update_monitored_sectors(current_user=current_user, monitored_families=payload.monitored_families)
    return ApiResponse(success=True, data=data)


# REQ-006: Suscripción y Facturación (#29)
@router.get("/subscription")
async def get_subscription(
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    data = await service.get_subscription_summary(current_user=current_user)
    return ApiResponse(success=True, data=data)


@router.put("/subscription")
async def update_subscription_plan(
    payload: SubscriptionPlanUpdatePayload,
    current_user: dict = Depends(get_current_user),
    service: B2BSuiteService = Depends(get_b2b_suite_service),
):
    role_code = (current_user.get("rol") or {}).get("codigo")
    if role_code not in ("TENANT_ADMIN", "PLATFORM_ADMIN", "PROVEEDOR"):
        raise HTTPException(
            status_code=403,
            detail={"code": "FORBIDDEN", "message": "Solo administradores de la organización pueden modificar el plan de suscripción."},
        )
    data = await service.update_subscription_plan(current_user=current_user, payload=payload.model_dump())
    return ApiResponse(success=True, data=data)
