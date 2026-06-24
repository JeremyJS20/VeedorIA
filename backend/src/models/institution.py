from typing import ClassVar

from sqlmodel import Field, SQLModel


class Institution(SQLModel, table=True):
    __tablename__: ClassVar[str] = "institution"

    id: int | None = Field(default=None, primary_key=True)
    dgcp_id: str = Field(unique=True, index=True, max_length=50)
    name: str = Field(max_length=255)
    acronym: str | None = Field(default=None, max_length=20)
    sector: str | None = Field(default=None, max_length=100)
    process_count: int = Field(default=0)
    total_amount: float = Field(default=0.0)
