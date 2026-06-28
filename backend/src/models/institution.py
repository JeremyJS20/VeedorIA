from typing import ClassVar

from sqlmodel import Field, SQLModel


class Institution(SQLModel, table=True):
    __tablename__: ClassVar[str] = "institution"

    id: int | None = Field(default=None, primary_key=True)
    dgcp_id: str = Field(unique=True, index=True, max_length=50)
    name: str = Field(max_length=255)
