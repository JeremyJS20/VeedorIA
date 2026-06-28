"""Change supplier text fields from VARCHAR to TEXT

Revision ID: c7a7d2e8f1b0
Revises: c6a7d2e8f1b0
Create Date: 2026-06-26 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7a7d2e8f1b0"
down_revision: Union[str, Sequence[str], None] = "c6a7d2e8f1b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("supplier", "registered_name", type_=sa.Text(), existing_type=sa.String(255))
    op.alter_column("supplier", "trade_name", type_=sa.Text(), existing_type=sa.String(255))
    op.alter_column("supplier", "email", type_=sa.Text(), existing_type=sa.String(255))
    op.alter_column("supplier", "address", type_=sa.Text(), existing_type=sa.String(500))
    op.alter_column("supplier", "classification", type_=sa.Text(), existing_type=sa.String(100))
    op.alter_column("supplier", "supplier_type", type_=sa.Text(), existing_type=sa.String(50))


def downgrade() -> None:
    op.alter_column("supplier", "registered_name", type_=sa.String(255), existing_type=sa.Text())
    op.alter_column("supplier", "trade_name", type_=sa.String(255), existing_type=sa.Text())
    op.alter_column("supplier", "email", type_=sa.String(255), existing_type=sa.Text())
    op.alter_column("supplier", "address", type_=sa.String(500), existing_type=sa.Text())
    op.alter_column("supplier", "classification", type_=sa.String(100), existing_type=sa.Text())
    op.alter_column("supplier", "supplier_type", type_=sa.String(50), existing_type=sa.Text())
