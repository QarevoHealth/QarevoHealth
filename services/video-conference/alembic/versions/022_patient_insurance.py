"""CREATE patient_insurance table (eGK / German health insurance)

Revision ID: 022
Revises: 021
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "patient_insurance",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", UUID(as_uuid=True), nullable=False),
        sa.Column("insured_person_full_name", sa.String(255), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("insurance_number", sa.String(50), nullable=True),
        sa.Column("insurance_provider_name", sa.String(100), nullable=True),
        sa.Column("insurance_provider_id", sa.String(20), nullable=True),
        sa.Column("card_access_number", sa.String(6), nullable=True),
        sa.Column("insured_status", sa.String(50), nullable=True),
        sa.Column("validity_start", sa.Date(), nullable=True),
        sa.Column("validity_end", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
    )
    op.create_unique_constraint("uq_patient_insurance_patient_id", "patient_insurance", ["patient_id"])
    op.create_index("ix_patient_insurance_insurance_number", "patient_insurance", ["insurance_number"], unique=False)


def downgrade() -> None:
    op.drop_table("patient_insurance")
