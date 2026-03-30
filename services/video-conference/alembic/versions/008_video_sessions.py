"""video_sessions table

Revision ID: 008
Revises: 007
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("consultation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("meeting_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_video_sessions_consultation_id"),
        "video_sessions",
        ["consultation_id"],
        unique=False,
    )
    op.create_index(op.f("ix_video_sessions_meeting_id"), "video_sessions", ["meeting_id"], unique=False)
    op.create_index(op.f("ix_video_sessions_status"), "video_sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_video_sessions_status"), table_name="video_sessions")
    op.drop_index(op.f("ix_video_sessions_meeting_id"), table_name="video_sessions")
    op.drop_index(op.f("ix_video_sessions_consultation_id"), table_name="video_sessions")
    op.drop_table("video_sessions")
