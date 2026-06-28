"""Add ON DELETE SET NULL to contract.process_id FK

Revision ID: c4a7d2e8f1b0
Revises: 3db536f8db33
Create Date: 2026-06-25 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a7d2e8f1b0"
down_revision: Union[str, Sequence[str], None] = "3db536f8db33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contract CASCADE")
    op.create_table(
        "contract",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("process_id", sa.Integer(), nullable=True),
        sa.Column("contract_id", sa.String(length=100), nullable=False),
        sa.Column("amount_adjudicated", sa.Float(), nullable=True),
        sa.Column("signed_date", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=True),
        sa.Column("object_description", sa.String(length=500), nullable=True),
        sa.Column("adjudication_status", sa.String(length=50), nullable=True),
        sa.Column("creation_date", sa.DateTime(), nullable=True),
        sa.Column("rpe", sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("contract_id", "process_id", name="uq_contract_id_process_id"),
        sa.ForeignKeyConstraint(["process_id"], ["process.id"], ondelete="SET NULL"),
    )
    op.create_foreign_key("item_contract_id_fkey", "item", "contract", ["contract_id"], ["id"])
    op.create_foreign_key("anomaly_contract_id_fkey", "anomaly", "contract", ["contract_id"], ["id"])


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contract CASCADE")
    op.create_table(
        "contract",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("process_id", sa.Integer(), nullable=True),
        sa.Column("contract_id", sa.String(length=100), nullable=False),
        sa.Column("amount_adjudicated", sa.Float(), nullable=True),
        sa.Column("signed_date", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=True),
        sa.Column("object_description", sa.String(length=500), nullable=True),
        sa.Column("adjudication_status", sa.String(length=50), nullable=True),
        sa.Column("creation_date", sa.DateTime(), nullable=True),
        sa.Column("rpe", sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("contract_id", "process_id", name="uq_contract_id_process_id"),
        sa.ForeignKeyConstraint(["process_id"], ["process.id"]),
    )
    op.create_foreign_key("item_contract_id_fkey", "item", "contract", ["contract_id"], ["id"])
    op.create_foreign_key("anomaly_contract_id_fkey", "anomaly", "contract", ["contract_id"], ["id"])
