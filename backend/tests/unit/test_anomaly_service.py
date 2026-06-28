import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.anomaly import Anomaly
from src.models.audit_log import AuditLog
from src.services.anomaly_service import (
    _compute_if_scores,
    _compute_z_scores,
    AnomalyService,
)


class TestComputeIfScores:
    def test_few_items(self):
        scores = _compute_if_scores([100.0, 200.0])
        assert len(scores) == 2
        assert all(s == 0.0 for s in scores)

    def test_detects_outliers(self):
        normal = [100.0, 105.0, 102.0, 98.0, 101.0, 103.0, 99.0, 104.0, 100.0, 97.0]
        normal.extend([500.0, 600.0, 550.0])
        prices = normal + [5000.0, 10000.0]
        scores = _compute_if_scores(prices)
        assert len(scores) == len(prices)
        negative = [s for s in scores if s < 0]
        assert len(negative) >= 1


class TestComputeZScores:
    def test_all_same(self):
        scores = _compute_z_scores([100.0, 100.0, 100.0])
        assert all(s == 0.0 for s in scores)

    def test_outlier_detected(self):
        scores = _compute_z_scores([100.0] * 9 + [10000.0])
        assert abs(scores[-1]) > 2.0

    def test_single_item(self):
        scores = _compute_z_scores([42.0])
        assert scores == [0.0]


@pytest.mark.asyncio
async def test_create_and_list(db_session: AsyncSession):
    svc = AnomalyService(db=db_session)
    a = Anomaly(
        anomaly_type="PRICE_ANOMALY",
        severity=0.8,
        score=-0.5,
        description="Test anomaly",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    items, total = await svc.get_anomalies(limit=10)
    assert len(items) == 1
    assert total == 1
    assert items[0].id == a.id


@pytest.mark.asyncio
async def test_review_updates_status(db_session: AsyncSession):
    from src.models.user import User

    u = User(
        email="reviewer@test.com",
        password_hash="dummy",
        full_name="Reviewer",
        role="AUDITOR",
    )
    db_session.add(u)
    await db_session.flush()

    svc = AnomalyService(db=db_session)
    a = Anomaly(
        anomaly_type="FRAGMENTATION",
        severity=0.6,
        description="Fragmentation test",
    )
    db_session.add(a)
    await db_session.commit()
    await db_session.refresh(a)

    result = await svc.review_anomaly(
        anomaly_id=a.id,
        reviewer_id=u.id,
        status="CONFIRMED",
        notes="Revisado manualmente - se confirma fraccionamiento",
    )
    assert result is not None
    assert result.status == "CONFIRMED"
    assert result.reviewer_id == u.id

    from src.models.audit_log import AuditLog
    log_result = await db_session.execute(
        select(AuditLog).where(AuditLog.entity_id == a.id)
    )
    log = log_result.scalar_one_or_none()
    assert log is not None
    assert log.action_type == "ANOMALY_REVIEW"


@pytest.mark.asyncio
async def test_get_stats(db_session: AsyncSession):
    svc = AnomalyService(db=db_session)
    for typ in ["PRICE_ANOMALY", "FRAGMENTATION", "COLLUSION"]:
        db_session.add(Anomaly(anomaly_type=typ, severity=0.5, description=f"{typ} test"))
    await db_session.commit()

    stats = await svc.get_anomaly_stats()
    assert stats["total"] == 3
    assert stats["total_by_type"]["PRICE_ANOMALY"] == 1
    assert stats["total_by_type"]["FRAGMENTATION"] == 1
    assert stats["total_by_type"]["COLLUSION"] == 1
    assert stats["avg_severity"] == 0.5


@pytest.mark.asyncio
async def test_nonexistent_review(db_session: AsyncSession):
    from src.models.user import User
    u = User(email="noreview@test.com", password_hash="dummy", full_name="No", role="AUDITOR")
    db_session.add(u)
    await db_session.flush()

    svc = AnomalyService(db=db_session)
    result = await svc.review_anomaly(
        anomaly_id=str(uuid.uuid4()),
        reviewer_id=u.id,
        status="CONFIRMED",
    )
    assert result is None


@pytest.mark.asyncio
async def test_get_anomaly_empty(db_session: AsyncSession):
    svc = AnomalyService(db=db_session)
    result = await svc.get_anomaly("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_get_anomalies_filtered(db_session: AsyncSession):
    svc = AnomalyService(db=db_session)
    for typ in ["PRICE_ANOMALY", "FRAGMENTATION"]:
        db_session.add(Anomaly(anomaly_type=typ, severity=0.5, description=f"{typ} test"))
    await db_session.commit()

    items, total = await svc.get_anomalies(anomaly_type="PRICE_ANOMALY")
    assert len(items) == 1
    assert total == 1
    assert items[0].anomaly_type == "PRICE_ANOMALY"


@pytest.mark.asyncio
async def test_get_anomalies_severity_filter(db_session: AsyncSession):
    svc = AnomalyService(db=db_session)
    db_session.add(Anomaly(anomaly_type="PRICE_ANOMALY", severity=0.3, description="low"))
    db_session.add(Anomaly(anomaly_type="PRICE_ANOMALY", severity=0.8, description="high"))
    await db_session.commit()

    items, total = await svc.get_anomalies(min_severity=0.5)
    assert len(items) == 1
    assert total == 1
    assert items[0].severity == 0.8
