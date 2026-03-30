"""CREATE user_consents table (TERMS, PRIVACY, TELEHEALTH, MARKETING)

Revision ID: 021
Revises: 020
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "021"
down_revision: Union[str, None] = "020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_consents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("consent_type", sa.String(50), nullable=False),
        sa.Column("accepted", sa.Boolean(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.String(20), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_unique_constraint(
        "uq_user_consents_user_id_consent_type",
        "user_consents",
        ["user_id", "consent_type"],
    )
    op.create_index("ix_user_consents_user_id", "user_consents", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("user_consents")
