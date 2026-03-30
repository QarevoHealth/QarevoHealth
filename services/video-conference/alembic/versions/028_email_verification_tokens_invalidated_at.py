"""ADD invalidated_at to email_verification_tokens and password_reset_tokens (superseded by resend)

Revision ID: 028
Revises: 027
Create Date: 2026-03-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "028"
down_revision: Union[str, None] = "027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "email_verification_tokens",
        sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "password_reset_tokens",
        sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("password_reset_tokens", "invalidated_at")
    op.drop_column("email_verification_tokens", "invalidated_at")
