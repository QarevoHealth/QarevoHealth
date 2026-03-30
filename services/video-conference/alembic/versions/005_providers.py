"""providers table

Revision ID: 005
Revises: 004
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "providers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("specialty", sa.String(), nullable=True),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("license_number", sa.String(), nullable=True),
        sa.Column("is_independent", sa.Boolean(), nullable=True, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_providers_user_id"), "providers", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_providers_user_id"), table_name="providers")
    op.drop_table("providers")
