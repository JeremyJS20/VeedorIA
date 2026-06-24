from datetime import datetime
from typing import ClassVar

from sqlmodel import Field, SQLModel


class Contract(SQLModel, table=True):
    __tablename__: ClassVar[str] = "contract"

    id: int | None = Field(default=None, primary_key=True)
    process_id: int | None = Field(default=None, foreign_key="process.id")
    contract_id: str = Field(max_length=100)
    amount_adjudicated: float | None = Field(default=None)
    supplier_rnc: str | None = Field(default=None, max_length=11)
    signed_date: datetime | None = Field(default=None)
    start_date: datetime | None = Field(default=None)
    end_date: datetime | None = Field(default=None)
    status: str | None = Field(default=None, max_length=50)
