from fastapi import APIRouter, Depends

from src.domain.types import ApiResponse
from src.presentation.dependencies import get_current_user, get_dashboard_service
from src.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard-market"])


@router.get("/dashboard/overview", response_model=ApiResponse[dict])
async def dashboard_overview_endpoint(
    view_mode: str | None = None,
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> ApiResponse[dict]:
    data = await service.get_overview(current_user=current_user, view_mode=view_mode)
    return ApiResponse(data=data)


@router.get("/market/intelligence", response_model=ApiResponse[dict])
async def market_intelligence_endpoint(
    unspsc_family: str | None = None,
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> ApiResponse[dict]:
    data = await service.get_market_intelligence(
        current_user=current_user,
        unspsc_family=unspsc_family,
    )
    return ApiResponse(data=data)