"""ADD updated_at and (user_id, created_at) index to email_verification_tokens

Revision ID: 027
Revises: 026
Create Date: 2026-03-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "027"
down_revision: Union[str, None] = "026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "email_verification_tokens",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_email_verification_tokens_user_id_created_at",
        "email_verification_tokens",
        ["user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_password_reset_tokens_user_id_created_at",
        "password_reset_tokens",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_password_reset_tokens_user_id_created_at", table_name="password_reset_tokens")
    op.drop_index("ix_email_verification_tokens_user_id_created_at", table_name="email_verification_tokens")
    op.drop_column("email_verification_tokens", "updated_at")
