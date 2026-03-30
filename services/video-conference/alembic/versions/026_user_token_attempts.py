"""CREATE user_token_attempts table (failed verify/reset attempts)

Revision ID: 026
Revises: 025
Create Date: 2026-03-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "026"
down_revision: Union[str, None] = "025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_token_attempts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("token_type", sa.String(50), nullable=False),
        sa.Column("attempt_type", sa.String(50), nullable=False),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_user_token_attempts_user_id",
        "user_token_attempts",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_token_attempts_user_id_token_type_attempted_at",
        "user_token_attempts",
        ["user_id", "token_type", "attempted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("user_token_attempts")
