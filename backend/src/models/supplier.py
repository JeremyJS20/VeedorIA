from typing import ClassVar

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class Supplier(SQLModel, table=True):
    __tablename__: ClassVar[str] = "supplier"

    id: int | None = Field(default=None, primary_key=True)
    rnc: str = Field(unique=True, index=True, max_length=50)
    registered_name: str | None = Field(default=None, sa_type=sa.Text())
    trade_name: str | None = Field(default=None, sa_type=sa.Text())
    phone: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, sa_type=sa.Text())
    address: str | None = Field(default=None, sa_type=sa.Text())
    status: str | None = Field(default=None, max_length=50)
    is_mipyme: bool | None = Field(default=None)
    classification: str | None = Field(default=None, sa_type=sa.Text())
    supplier_type: str | None = Field(default=None, sa_type=sa.Text())
    province: str | None = Field(default=None, max_length=100)
    municipality: str | None = Field(default=None, max_length=100)
