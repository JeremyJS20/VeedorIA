"""add_process_type_and_details_to_sync_log

Revision ID: a7a2bba8dc39
Revises: 5f79a3ded504
Create Date: 2026-06-28 14:06:04.027457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a7a2bba8dc39'
down_revision: Union[str, Sequence[str], None] = '5f79a3ded504'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('sync_log', schema=None) as batch_op:
        batch_op.add_column(sa.Column('process_type', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default='sync'))
        batch_op.add_column(sa.Column('details', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('sync_log', schema=None) as batch_op:
        batch_op.drop_column('details')
        batch_op.drop_column('process_type')
