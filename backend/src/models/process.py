from datetime import datetime
from typing import ClassVar

from sqlmodel import Field, SQLModel


class Process(SQLModel, table=True):
    __tablename__: ClassVar[str] = "process"

    id: int | None = Field(default=None, primary_key=True)
    ocid: str = Field(unique=True, index=True, max_length=100)
    dgcp_code: str | None = Field(default=None, max_length=50)
    title: str = Field(max_length=500)
    procurement_method: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=50)
    estimated_amount: float | None = Field(default=None)
    currency: str = Field(default="DOP", max_length=3)
    published_date: datetime | None = Field(default=None)
    deadline_date: datetime | None = Field(default=None)
    institution_id: int | None = Field(default=None, foreign_key="institution.id")
