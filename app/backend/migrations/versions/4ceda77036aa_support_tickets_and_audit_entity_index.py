"""support tickets and audit entity index

Revision ID: 4ceda77036aa
Revises: a7a2bba8dc39
Create Date: 2026-10-20 23:46:31.883173

NOTA: la cadena de migraciones existente no crea las tablas `app_user` ni
`tenant` (fuente: `src/models/auth.py`, creadas por `SQLModel.metadata.create_all`
en `init_db`). Un upgrade sobre una base construida solo con Alembic en
PostgreSQL falla con `42P01 relation "app_user" does not exist` al declarar las
FK. Por eso las columnas se crean sin `ForeignKeyConstraint`; los modelos
conservan sus `foreign_key` para `create_all` y las pruebas.
"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4ceda77036aa'
down_revision: str | Sequence[str] | None = 'a7a2bba8dc39'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'support_ticket',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'code', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False
        ),
        sa.Column(
            'subject', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False
        ),
        sa.Column(
            'category', sqlmodel.sql.sqltypes.AutoString(length=30), nullable=False
        ),
        sa.Column(
            'module', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=False
        ),
        sa.Column(
            'priority', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False
        ),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column(
            'status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False
        ),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('reporter_tenant_id', sa.Integer(), nullable=False),
        sa.Column('assigned_to_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_support_ticket_code'), 'support_ticket', ['code'], unique=True
    )
    op.create_index(
        op.f('ix_support_ticket_status'), 'support_ticket', ['status'], unique=False
    )
    op.create_index(
        op.f('ix_support_ticket_reporter_id'),
        'support_ticket',
        ['reporter_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_support_ticket_reporter_tenant_id'),
        'support_ticket',
        ['reporter_tenant_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_support_ticket_assigned_to_id'),
        'support_ticket',
        ['assigned_to_id'],
        unique=False,
    )
    op.create_table(
        'support_ticket_message',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_support_ticket_message_ticket_id'),
        'support_ticket_message',
        ['ticket_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_support_ticket_message_author_id'),
        'support_ticket_message',
        ['author_id'],
        unique=False,
    )
    op.create_index(
        'ix_audit_log_entity_type', 'audit_log', ['entity_type'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_audit_log_entity_type', table_name='audit_log')
    op.drop_index(
        op.f('ix_support_ticket_message_author_id'),
        table_name='support_ticket_message',
    )
    op.drop_index(
        op.f('ix_support_ticket_message_ticket_id'),
        table_name='support_ticket_message',
    )
    op.drop_table('support_ticket_message')
    op.drop_index(
        op.f('ix_support_ticket_assigned_to_id'), table_name='support_ticket'
    )
    op.drop_index(
        op.f('ix_support_ticket_reporter_tenant_id'), table_name='support_ticket'
    )
    op.drop_index(
        op.f('ix_support_ticket_reporter_id'), table_name='support_ticket'
    )
    op.drop_index(op.f('ix_support_ticket_status'), table_name='support_ticket')
    op.drop_index(op.f('ix_support_ticket_code'), table_name='support_ticket')
    op.drop_table('support_ticket')
