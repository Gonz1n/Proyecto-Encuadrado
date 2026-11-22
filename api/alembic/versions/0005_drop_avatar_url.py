"""drop_avatar_url

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-21 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('users', 'avatar_url')


def downgrade() -> None:
    op.add_column('users', sa.Column('avatar_url', sa.String(length=200), server_default='', nullable=False))
