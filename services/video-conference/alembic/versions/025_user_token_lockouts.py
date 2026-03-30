"""CREATE user_token_lockouts table (3 attempts/day, 1-day lock)

Revision ID: 025
Revises: 024
Create Date: 2026-03-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "025"
down_revision: Union[str, None] = "024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_token_lockouts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("token_type", sa.String(50), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_user_token_lockouts_user_id",
        "user_token_lockouts",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_token_lockouts_user_id_token_type",
        "user_token_lockouts",
        ["user_id", "token_type"],
        unique=True,
    )
    op.create_index(
        "ix_user_token_lockouts_locked_until",
        "user_token_lockouts",
        ["locked_until"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("user_token_lockouts")
