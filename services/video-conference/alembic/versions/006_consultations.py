"""consultations table

Revision ID: 006
Revises: 005
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consultations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_consultations_patient_id"), "consultations", ["patient_id"], unique=False)
    op.create_index(op.f("ix_consultations_status"), "consultations", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_consultations_status"), table_name="consultations")
    op.drop_index(op.f("ix_consultations_patient_id"), table_name="consultations")
    op.drop_table("consultations")
