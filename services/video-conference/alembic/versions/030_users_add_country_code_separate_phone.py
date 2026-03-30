"""Add country_code column to users table (stored separately from phone).

Revision ID: 030
Revises: 029
Create Date: 2026-03-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "030"
down_revision: Union[str, None] = "029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("country_code", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "country_code")
