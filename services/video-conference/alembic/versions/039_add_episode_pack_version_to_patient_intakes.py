"""add episode_pack_version_id to patient_intakes

Revision ID: 039
Revises: 038
Create Date: 2026-05-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "039"
down_revision: Union[str, None] = "038"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patient_intakes",
        sa.Column(
            "episode_pack_version_id",
            UUID(as_uuid=True),
            nullable=False,
        ),
    )
    # Create foreign key constraint without cascade delete
    op.create_foreign_key(
        "fk_patient_intakes_episode_pack_version",
        "patient_intakes",
        "episode_pack_versions",
        ["episode_pack_version_id"],
        ["id"],
    )
    # Create index
    op.create_index(
        op.f("ix_patient_intakes_episode_pack_version_id"),
        "patient_intakes",
        ["episode_pack_version_id"],
        unique=False,
    )
    # Remove server default now that column is populated
    op.alter_column(
        "patient_intakes",
        "episode_pack_version_id",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_patient_intakes_episode_pack_version_id"), table_name="patient_intakes")
    op.drop_constraint("fk_patient_intakes_episode_pack_version", "patient_intakes", type_="foreignkey")
    op.drop_column("patient_intakes", "episode_pack_version_id")
