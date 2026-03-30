"""video_session_artifacts table

Revision ID: 010
Revises: 009
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_session_artifacts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("video_session_id", UUID(as_uuid=True), nullable=False),
        sa.Column("artifact_type", sa.String(), nullable=True),
        sa.Column("s3_url", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["video_session_id"], ["video_sessions.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_video_session_artifacts_video_session_id"),
        "video_session_artifacts",
        ["video_session_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_video_session_artifacts_video_session_id"), table_name="video_session_artifacts")
    op.drop_table("video_session_artifacts")
