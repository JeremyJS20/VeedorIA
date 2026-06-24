from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    message: str = ""


class ApiErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: list[dict] = []
