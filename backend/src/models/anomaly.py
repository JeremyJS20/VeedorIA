import uuid
from datetime import UTC, datetime
from enum import Enum as PyEnum
from typing import ClassVar

from sqlmodel import Field, SQLModel


class AnomalyType(str, PyEnum):
    PRICE_ANOMALY = "PRICE_ANOMALY"
    FRAGMENTATION = "FRAGMENTATION"
    COLLUSION = "COLLUSION"


class AnomalyStatus(str, PyEnum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    DISMISSED = "DISMISSED"


class Anomaly(SQLModel, table=True):
    __tablename__: ClassVar[str] = "anomaly"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    process_id: int | None = Field(default=None, foreign_key="process.id")
    contract_id: int | None = Field(default=None, foreign_key="contract.id")
    anomaly_type: str = Field(max_length=50)
    severity: float = Field(default=0.0, ge=0.0, le=1.0)
    score: float | None = Field(default=None)
    description: str = Field(max_length=2000)
    status: str = Field(default=AnomalyStatus.PENDING.value, max_length=20)
    reviewer_id: str | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)},
    )
