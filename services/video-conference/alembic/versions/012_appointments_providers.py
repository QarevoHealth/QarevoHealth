"""appointments_providers junction table

Revision ID: 012
Revises: 011
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointments_providers",
        sa.Column("appointment_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider_id", UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="PRIMARY"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("appointment_id", "provider_id"),
    )
    op.create_index(
        op.f("ix_appointments_providers_appointment_id"),
        "appointments_providers",
        ["appointment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointments_providers_provider_id"),
        "appointments_providers",
        ["provider_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_appointments_providers_provider_id"), table_name="appointments_providers")
    op.drop_index(op.f("ix_appointments_providers_appointment_id"), table_name="appointments_providers")
    op.drop_table("appointments_providers")
