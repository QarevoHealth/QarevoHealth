"""consultations_providers junction table

Revision ID: 007
Revises: 006
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consultations_providers",
        sa.Column("consultation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider_id", UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("consultation_id", "provider_id"),
    )
    op.create_index(
        op.f("ix_consultations_providers_consultation_id"),
        "consultations_providers",
        ["consultation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_consultations_providers_provider_id"),
        "consultations_providers",
        ["provider_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_consultations_providers_provider_id"), table_name="consultations_providers")
    op.drop_index(op.f("ix_consultations_providers_consultation_id"), table_name="consultations_providers")
    op.drop_table("consultations_providers")
