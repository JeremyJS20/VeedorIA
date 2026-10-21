from src.infrastructure.time_utils import utcnow_naive


def test_utcnow_naive_returns_naive_datetime():
    now = utcnow_naive()
    assert now.tzinfo is None


def test_audit_log_default_timestamp_is_naive():
    from src.models.audit_log import AuditLog

    log = AuditLog(action_type="TEST", entity_type="test", entity_id="test-1")
    assert log.timestamp.tzinfo is None
