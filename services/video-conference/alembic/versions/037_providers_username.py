"""ADD username to providers

Revision ID: 037
Revises: 035
Create Date: 2026-04-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "037"
down_revision: Union[str, None] = "035"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "providers",
        sa.Column("username", sa.String(100), nullable=True),
    )
    op.create_index("ix_providers_username", "providers", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_providers_username", table_name="providers")
    op.drop_column("providers", "username")
