from typing import ClassVar

from sqlmodel import Field, SQLModel


class Item(SQLModel, table=True):
    __tablename__: ClassVar[str] = "item"

    id: int | None = Field(default=None, primary_key=True)
    contract_id: int | None = Field(default=None, foreign_key="contract.id")
    description: str = Field(max_length=500)
    quantity: float = Field(default=1.0)
    unit: str | None = Field(default=None, max_length=50)
    unit_price: float | None = Field(default=None)
    total_amount: float | None = Field(default=None)
    unspsc_code: str | None = Field(default=None, max_length=8)
