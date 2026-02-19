"""video_session_attendees table

Revision ID: 009
Revises: 008
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_session_attendees",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("video_session_id", UUID(as_uuid=True), nullable=False),
        sa.Column("participant_user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("participant_role", sa.String(), nullable=True),
        sa.Column("attendee_id", sa.String(), nullable=True),
        sa.Column("join_payload", sa.JSON(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["video_session_id"], ["video_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["participant_user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_video_session_attendees_video_session_id"),
        "video_session_attendees",
        ["video_session_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_video_session_attendees_participant_user_id"),
        "video_session_attendees",
        ["participant_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_video_session_attendees_attendee_id"),
        "video_session_attendees",
        ["attendee_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_video_session_attendees_attendee_id"), table_name="video_session_attendees")
    op.drop_index(op.f("ix_video_session_attendees_participant_user_id"), table_name="video_session_attendees")
    op.drop_index(op.f("ix_video_session_attendees_video_session_id"), table_name="video_session_attendees")
    op.drop_table("video_session_attendees")
