"""add_anomaly_enrichment_fields

Revision ID: 5f79a3ded504
Revises: c7a7d2e8f1b0
Create Date: 2026-06-28 08:29:05.954657

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '5f79a3ded504'
down_revision: Union[str, Sequence[str], None] = 'c7a7d2e8f1b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('anomaly', schema=None) as batch_op:
        batch_op.add_column(sa.Column('amount', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('process_code', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
        batch_op.add_column(sa.Column('supplier_name', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))
        batch_op.add_column(sa.Column('institution_name', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('anomaly', schema=None) as batch_op:
        batch_op.drop_column('institution_name')
        batch_op.drop_column('supplier_name')
        batch_op.drop_column('process_code')
        batch_op.drop_column('amount')
