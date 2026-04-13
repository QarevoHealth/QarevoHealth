"""ADD license_verified, address columns, updated_at to providers

Revision ID: 034
Revises: 033
Create Date: 2026-04-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "034"
down_revision: Union[str, None] = "033"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("providers", sa.Column("license_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("providers", sa.Column("address_line1", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("address_line2", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("address_city", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("address_state", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("address_country", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("address_zip", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))


def downgrade() -> None:
    op.drop_column("providers", "updated_at")
    op.drop_column("providers", "address_zip")
    op.drop_column("providers", "address_country")
    op.drop_column("providers", "address_state")
    op.drop_column("providers", "address_city")
    op.drop_column("providers", "address_line2")
    op.drop_column("providers", "address_line1")
    op.drop_column("providers", "license_verified")
