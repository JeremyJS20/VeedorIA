"""Utilidades de tiempo compartidas.

Convención: las columnas TIMESTAMP WITHOUT TIME ZONE de PostgreSQL
(audit_log.timestamp, detection_config.updated_at, anomaly.*, sync_log.*,
tabla legacy user.*) reciben datetimes NAIVE en UTC. asyncpg rechaza
datetimes aware contra columnas naive.
"""

from datetime import UTC, datetime


def utcnow_naive() -> datetime:
    """Instante UTC actual sin tzinfo (compatible con TIMESTAMP naive)."""
    return datetime.now(UTC).replace(tzinfo=None)
