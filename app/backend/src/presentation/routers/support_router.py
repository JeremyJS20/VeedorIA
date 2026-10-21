"""Endpoints de autoservicio del centro de soporte (`/api/support/*`)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.types import ApiResponse
from src.infrastructure.dependencies import get_db
from src.presentation.dependencies import get_current_user
from src.services.admin_support_service import AdminSupportService

router = APIRouter(prefix="/support", tags=["support"])


class SupportTicketCreatePayload(BaseModel):
    subject: str = Field(default="")
    category: str = Field(default="SOPORTE_FUNCIONAL")
    module: str = Field(default="OTRO")
    priority: str = Field(default="MEDIA")
    description: str = Field(default="")


def get_support_service(db: AsyncSession = Depends(get_db)) -> AdminSupportService:
    return AdminSupportService(db=db)


@router.post("/tickets", status_code=201, response_model=ApiResponse[dict])
async def create_support_ticket(
    payload: SupportTicketCreatePayload,
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_support_service),
):
    data = await service.create_ticket(current_user, payload.model_dump())
    return ApiResponse(success=True, data=data, message="Ticket registrado")


@router.get("/tickets", response_model=ApiResponse[list[dict]])
async def list_my_support_tickets(
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_support_service),
):
    data = await service.list_my_tickets(current_user)
    return ApiResponse(success=True, data=data)


@router.get("/tickets/{ticket_id}", response_model=ApiResponse[dict])
async def get_my_support_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    service: AdminSupportService = Depends(get_support_service),
):
    data = await service.get_ticket(current_user, ticket_id)
    return ApiResponse(success=True, data=data)
