"""add_supplier_fields

Revision ID: a7b2c9d8e4f1
Revises: 4f3d253b6114
Create Date: 2026-06-25 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b2c9d8e4f1'
down_revision: Union[str, Sequence[str], None] = '4f3d253b6114'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('supplier', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('is_mipyme', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('classification', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('supplier_type', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('province', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('municipality', sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('supplier', schema=None) as batch_op:
        batch_op.drop_column('municipality')
        batch_op.drop_column('province')
        batch_op.drop_column('supplier_type')
        batch_op.drop_column('classification')
        batch_op.drop_column('is_mipyme')
        batch_op.drop_column('status')
