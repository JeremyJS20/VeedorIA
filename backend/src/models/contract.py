from datetime import datetime
from typing import ClassVar

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Contract(SQLModel, table=True):
    __tablename__: ClassVar[str] = "contract"
    __table_args__ = (UniqueConstraint("contract_id", "process_id", name="uq_contract_id_process_id"),)

    id: int | None = Field(default=None, primary_key=True)
    process_id: int | None = Field(default=None, foreign_key="process.id")
    contract_id: str = Field(max_length=100)
    amount_adjudicated: float | None = Field(default=None)
    signed_date: datetime | None = Field(default=None)
    status: str | None = Field(default=None, max_length=50)
    supplier_name: str | None = Field(default=None, max_length=255)
    currency: str | None = Field(default=None, max_length=3)
    object_description: str | None = Field(default=None, max_length=500)
    adjudication_status: str | None = Field(default=None, max_length=50)
    creation_date: datetime | None = Field(default=None)
    rpe: str | None = Field(default=None, max_length=20)
