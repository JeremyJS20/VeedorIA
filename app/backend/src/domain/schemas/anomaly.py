from datetime import datetime

from pydantic import BaseModel, Field


class AnomalyResponse(BaseModel):
    id: str
    process_id: int | None = None
    contract_id: int | None = None
    anomaly_type: str
    severity: float
    score: float | None = None
    confidence: str | None = None
    signals_count: int = 0
    detection_metadata: dict | None = None
    description: str
    status: str
    reviewer_id: str | None = None
    dismissal_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    amount: float | None = None
    process_code: str | None = None
    supplier_name: str | None = None
    institution_name: str | None = None


class AnomalyListResponse(BaseModel):
    items: list[AnomalyResponse]
    total: int
    page: int = 1
    limit: int = 50


class AnomalyReviewPayload(BaseModel):
    status: str = Field(..., pattern=r"^(CONFIRMED|DISMISSED)$")
    notes: str | None = Field(None, min_length=10)
    dismissal_reason: str | None = Field(None, pattern=r"^(FALSE_POSITIVE|DUPLICATE|DATA_ERROR|ALREADY_KNOWN)$")


class AnomalyStats(BaseModel):
    total: int = 0
    total_by_type: dict[str, int]
    total_by_status: dict[str, int]
    avg_severity: float


class MarketPrice(BaseModel):
    contract_id: int
    supplier_name: str | None = None
    unit_price: float
    is_anomaly: bool = False
    description: str | None = None


class TimelineEntry(BaseModel):
    date: str
    reference: str
    title: str
    amount: float
    is_alert: bool = False
    alert_message: str | None = None


class CollusionLink(BaseModel):
    source: str
    source_rnc: str | None = None
    target: str
    target_rnc: str | None = None
    reason: str
    weight: float
    signal_details: dict = Field(default_factory=dict)


class AnomalyContext(BaseModel):
    anomaly_type: str
    severity: float
    score: float | None = None
    confidence: float = 0.0
    signals_count: int = 0
    amount: float | None = None
    process_code: str | None = None
    supplier_name: str | None = None
    institution_name: str | None = None
    market_prices: list[MarketPrice] = []
    fragmentation_threshold: float = 8000000.0
    fragmentation_combined_amount: float | None = None
    recent_contracts: list[TimelineEntry] = []
    collusion_links: list[CollusionLink] = []
