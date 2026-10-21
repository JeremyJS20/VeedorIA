import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import ClassVar

from sqlmodel import JSON, Field, SQLModel

from src.infrastructure.time_utils import utcnow_naive


class UserRole(str, PyEnum):
    ADMIN = "ADMIN"
    AUDITOR = "AUDITOR"
    BIDDER = "BIDDER"
    CITIZEN = "CITIZEN"


class User(SQLModel, table=True):
    __tablename__: ClassVar[str] = "user"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    role: str = Field(default=UserRole.CITIZEN.value, max_length=20)
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(
        default_factory=utcnow_naive,
        sa_column_kwargs={"onupdate": utcnow_naive},
    )
    extra_data: str | None = Field(default=None, sa_type=JSON)
