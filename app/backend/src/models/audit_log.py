from datetime import UTC, datetime
from typing import ClassVar

from sqlmodel import JSON, Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__: ClassVar[str] = "audit_log"

    id: int | None = Field(default=None, primary_key=True)
    action_type: str = Field(max_length=50, index=True)
    user_id: str | None = Field(default=None, foreign_key="user.id", index=True)
    entity_type: str = Field(max_length=50)
    entity_id: str = Field(max_length=100)
    old_value: str | None = Field(default=None, sa_type=JSON)
    new_value: str | None = Field(default=None, sa_type=JSON)
    ip_address: str | None = Field(default=None, max_length=45)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        index=True,
    )
