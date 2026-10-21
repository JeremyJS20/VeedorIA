from datetime import datetime
from typing import ClassVar

from sqlmodel import Field, SQLModel, Text

from src.infrastructure.time_utils import utcnow_naive


class SupportTicket(SQLModel, table=True):
    __tablename__: ClassVar[str] = "support_ticket"

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(max_length=20, unique=True, index=True)
    subject: str = Field(max_length=200)
    category: str = Field(default="SOPORTE_FUNCIONAL", max_length=30)
    module: str = Field(default="OTRO", max_length=40)
    priority: str = Field(default="MEDIA", max_length=10)
    description: str = Field(sa_type=Text)
    status: str = Field(default="ABIERTO", max_length=20, index=True)
    reporter_id: int = Field(foreign_key="app_user.id", index=True)
    reporter_tenant_id: int = Field(foreign_key="tenant.id", index=True)
    assigned_to_id: int | None = Field(
        default=None, foreign_key="app_user.id", index=True
    )
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)
    closed_at: datetime | None = Field(default=None)


class SupportTicketMessage(SQLModel, table=True):
    __tablename__: ClassVar[str] = "support_ticket_message"

    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(
        foreign_key="support_ticket.id", index=True, ondelete="CASCADE"
    )
    author_id: int = Field(foreign_key="app_user.id", index=True)
    body: str = Field(sa_type=Text)
    created_at: datetime = Field(default_factory=utcnow_naive)
