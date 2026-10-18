from datetime import datetime, timezone
from typing import ClassVar

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class SyncLog(SQLModel, table=True):
    __tablename__: ClassVar[str] = "sync_log"

    id: int | None = Field(default=None, primary_key=True)
    process_type: str = Field(default="sync", max_length=20)
    started_at: datetime = Field(default_factory=_now)
    completed_at: datetime | None = Field(default=None)
    records_synced: int = Field(default=0)
    status: str = Field(default="running")
    error_message: str | None = Field(default=None)
    triggered_by: str = Field(default="cli")
    sync_type: str = Field(default="full", max_length=50)
    details: str | None = Field(default=None)
