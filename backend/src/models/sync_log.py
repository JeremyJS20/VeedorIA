from datetime import datetime, timezone
from typing import ClassVar

from sqlmodel import Field, SQLModel


class SyncLog(SQLModel, table=True):
    __tablename__: ClassVar[str] = "sync_log"

    id: int | None = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = Field(default=None)
    records_synced: int = Field(default=0)
    status: str = Field(default="running")
    error_message: str | None = Field(default=None)
    triggered_by: str = Field(default="cli")
