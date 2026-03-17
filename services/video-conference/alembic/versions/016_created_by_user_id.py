"""Add created_by_user_id to consultations and appointments

Revision ID: 016
Revises: 015
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "016"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "consultations",
        sa.Column("created_by_user_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_consultations_created_by_user_id",
        "consultations",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_consultations_created_by_user_id"),
        "consultations",
        ["created_by_user_id"],
        unique=False,
    )

    op.add_column(
        "appointments",
        sa.Column("created_by_user_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_appointments_created_by_user_id",
        "appointments",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_appointments_created_by_user_id"),
        "appointments",
        ["created_by_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_appointments_created_by_user_id"), table_name="appointments")
    op.drop_constraint("fk_appointments_created_by_user_id", "appointments", type_="foreignkey")
    op.drop_column("appointments", "created_by_user_id")

    op.drop_index(op.f("ix_consultations_created_by_user_id"), table_name="consultations")
    op.drop_constraint("fk_consultations_created_by_user_id", "consultations", type_="foreignkey")
    op.drop_column("consultations", "created_by_user_id")
