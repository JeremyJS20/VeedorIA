from fastapi import APIRouter, Depends, HTTPException, Query

from src.domain.types import ApiResponse
from src.presentation.dependencies import get_public_portal_service
from src.services.public_portal_service import PublicPortalService

router = APIRouter(prefix="/public", tags=["public-portal"])


@router.get("/institutions", response_model=ApiResponse[list[dict]])
async def list_public_institutions(
    limit: int = Query(250, ge=1, le=1000),
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[list[dict]]:
    data = await service.list_institutions(limit=limit)
    return ApiResponse(data=data)


@router.get("/tenders", response_model=ApiResponse[dict])
async def list_public_tenders(
    search: str | None = Query(None, description="Búsqueda en lenguaje natural o por código/proveedor/institución"),
    institution_id: int | None = Query(None, description="ID de institución"),
    province: str | None = Query(None, description="Provincia o región"),
    min_amount: float | None = Query(None, ge=0.0),
    max_amount: float | None = Query(None, ge=0.0),
    only_with_anomalies: bool = Query(False, description="Solo contrataciones con alertas de IA"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    data = await service.search_tenders(
        search=search,
        institution_id=institution_id,
        province=province,
        min_amount=min_amount,
        max_amount=max_amount,
        only_with_anomalies=only_with_anomalies,
        page=page,
        limit=limit,
    )
    return ApiResponse(data=data)


@router.get("/budget-overview", response_model=ApiResponse[dict])
async def get_public_budget_overview(
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    data = await service.get_budget_overview()
    return ApiResponse(data=data)


@router.get("/price-comparison", response_model=ApiResponse[list[dict]])
async def get_public_price_comparison(
    limit: int = Query(8, ge=1, le=50),
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[list[dict]]:
    data = await service.get_price_comparisons(limit=limit)
    return ApiResponse(data=data)


@router.get("/tenders/{contract_id}", response_model=ApiResponse[dict])
async def get_public_tender_detail(
    contract_id: int,
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    detail = await service.get_tender_detail(contract_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Contratación no encontrada")
    return ApiResponse(data=detail)


@router.get("/suppliers/{rnc}", response_model=ApiResponse[dict])
async def get_public_supplier_profile(
    rnc: str,
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    profile = await service.get_supplier_profile(rnc)
    if not profile:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return ApiResponse(data=profile)


@router.get("/institutions/{institution_id}", response_model=ApiResponse[dict])
async def get_public_institution_profile(
    institution_id: int,
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    profile = await service.get_institution_profile(institution_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    return ApiResponse(data=profile)


@router.get("/ranking", response_model=ApiResponse[dict])
async def get_public_ranking(
    search: str | None = Query(None),
    sort_by: str = Query("amount", pattern="^(amount|anomalies|transparency)$"),
    limit: int = Query(100, ge=1, le=500),
    service: PublicPortalService = Depends(get_public_portal_service),
) -> ApiResponse[dict]:
    data = await service.get_ranking(search=search, sort_by=sort_by, limit=limit)
    return ApiResponse(data=data)