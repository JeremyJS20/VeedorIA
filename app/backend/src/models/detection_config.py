from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class DetectionConfig(SQLModel, table=True):
    __tablename__: str = "detection_config"

    key: str = Field(primary_key=True, max_length=50)
    value: float = Field()
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None),
    )
