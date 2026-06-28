"""Add performance indexes for queries and ML features

Revision ID: c5a7d2e8f1b0
Revises: c4a7d2e8f1b0
Create Date: 2026-06-25 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "c5a7d2e8f1b0"
down_revision: Union[str, Sequence[str], None] = "c4a7d2e8f1b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # HIGH priority — actively used in sync
    op.create_index("ix_contract_contract_id", "contract", ["contract_id"])
    op.create_index("ix_sync_log_status_completed_at", "sync_log", ["status", "completed_at"])
    op.create_index("ix_sync_log_started_at", "sync_log", ["started_at"])
    op.create_index("ix_item_contract_id", "item", ["contract_id"])

    # MEDIUM — FK columns (PostgreSQL does NOT auto-index FKs)
    op.create_index("ix_contract_process_id", "contract", ["process_id"])
    op.create_index("ix_process_institution_id", "process", ["institution_id"])
    op.create_index("ix_anomaly_process_id", "anomaly", ["process_id"])
    op.create_index("ix_anomaly_contract_id", "anomaly", ["contract_id"])

    # ML — price anomaly detection
    op.create_index("ix_item_unspsc_code_unit_price", "item", ["unspsc_code", "unit_price"])

    # ML — collusion networks & supplier aggregation
    op.create_index("ix_contract_supplier_name", "contract", ["supplier_name"])
    op.create_index("ix_contract_creation_date", "contract", ["creation_date"])

    # ML — MSME analytics
    op.create_index("ix_supplier_is_mipyme", "supplier", ["is_mipyme"])
    op.create_index("ix_supplier_province", "supplier", ["province"])

    # ML — anomaly dashboard
    op.create_index("ix_anomaly_status_type", "anomaly", ["status", "anomaly_type"])


def downgrade() -> None:
    op.drop_index("ix_contract_contract_id", table_name="contract")
    op.drop_index("ix_sync_log_status_completed_at", table_name="sync_log")
    op.drop_index("ix_sync_log_started_at", table_name="sync_log")
    op.drop_index("ix_item_contract_id", table_name="item")
    op.drop_index("ix_contract_process_id", table_name="contract")
    op.drop_index("ix_process_institution_id", table_name="process")
    op.drop_index("ix_anomaly_process_id", table_name="anomaly")
    op.drop_index("ix_anomaly_contract_id", table_name="anomaly")
    op.drop_index("ix_item_unspsc_code_unit_price", table_name="item")
    op.drop_index("ix_contract_supplier_name", table_name="contract")
    op.drop_index("ix_contract_creation_date", table_name="contract")
    op.drop_index("ix_supplier_is_mipyme", table_name="supplier")
    op.drop_index("ix_supplier_province", table_name="supplier")
    op.drop_index("ix_anomaly_status_type", table_name="anomaly")
