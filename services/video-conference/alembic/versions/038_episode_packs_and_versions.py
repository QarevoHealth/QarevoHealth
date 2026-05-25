"""episode_packs and episode_pack_versions tables

Revision ID: 038
Revises: 037
Create Date: 2026-05-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "038"
down_revision: Union[str, None] = "037"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "episode_packs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("key", sa.String(length=100), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "episode_pack_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("episode_pack_id", UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.String(length=50), nullable=False),
        sa.Column("schema_json", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["episode_pack_id"], ["episode_packs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("episode_pack_id", "version", name="uq_episode_pack_versions_episode_pack_id_version"),
    )
    op.create_index(op.f("ix_episode_pack_versions_episode_pack_id"), "episode_pack_versions", ["episode_pack_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_episode_pack_versions_episode_pack_id"), table_name="episode_pack_versions")
    op.drop_table("episode_pack_versions")
    op.drop_table("episode_packs")
