"""CREATE audit_logs table.

Revision ID: 031
Revises: 030
Create Date: 2026-03-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "031"
down_revision: Union[str, None] = "030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),

        sa.Column("event_type", sa.String(60), nullable=False),
        sa.Column("event_category", sa.String(20), nullable=False),

        sa.Column("actor_user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("target_user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("consultation_id", UUID(as_uuid=True), nullable=True),
        sa.Column("video_session_id", UUID(as_uuid=True), nullable=True),

        sa.Column("resource_type", sa.String(50), nullable=True),
        sa.Column("resource_id", UUID(as_uuid=True), nullable=True),

        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("endpoint", sa.String(255), nullable=True),
        sa.Column("http_method", sa.String(10), nullable=True),

        sa.Column("request_id", sa.String(100), nullable=True),
        sa.Column("trace_id", sa.String(100), nullable=True),

        sa.Column("success", sa.Boolean, nullable=False),
        sa.Column("failure_reason", sa.Text, nullable=True),
        sa.Column("extra_data", JSONB, nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),

        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["video_session_id"], ["video_sessions.id"], ondelete="SET NULL"),
    )

    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_target_user_id", "audit_logs", ["target_user_id"])
    op.create_index("ix_audit_logs_tenant_id", "audit_logs", ["tenant_id"])
    op.create_index("ix_audit_logs_event_category", "audit_logs", ["event_category"])
    op.create_index("ix_audit_logs_event_type", "audit_logs", ["event_type"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
