"""Increase supplier rnc and phone max_length

Revision ID: c6a7d2e8f1b0
Revises: c5a7d2e8f1b0
Create Date: 2026-06-26 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c6a7d2e8f1b0"
down_revision: Union[str, Sequence[str], None] = "c5a7d2e8f1b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("supplier", "rnc", type_=sa.String(50), existing_type=sa.String(11))
    op.alter_column("supplier", "phone", type_=sa.String(100), existing_type=sa.String(50))


def downgrade() -> None:
    op.alter_column("supplier", "rnc", type_=sa.String(11), existing_type=sa.String(50))
    op.alter_column("supplier", "phone", type_=sa.String(50), existing_type=sa.String(100))
