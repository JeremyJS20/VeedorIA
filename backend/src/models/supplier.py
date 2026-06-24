from typing import ClassVar

from sqlmodel import JSON, Field, SQLModel


class Supplier(SQLModel, table=True):
    __tablename__: ClassVar[str] = "supplier"

    id: int | None = Field(default=None, primary_key=True)
    rnc: str = Field(unique=True, index=True, max_length=11)
    registered_name: str | None = Field(default=None, max_length=255)
    trade_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    extra_data: str | None = Field(default=None, sa_type=JSON)
