from typing import ClassVar

from sqlmodel import Field, SQLModel


class Process(SQLModel, table=True):
    __tablename__: ClassVar[str] = "process"

    id: int | None = Field(default=None, primary_key=True)
    dgcp_code: str = Field(unique=True, index=True, max_length=50)
    title: str = Field(max_length=500)
    institution_id: int | None = Field(default=None, foreign_key="institution.id")
