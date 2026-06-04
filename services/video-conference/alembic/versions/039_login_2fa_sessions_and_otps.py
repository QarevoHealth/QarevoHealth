"""CREATE login 2FA sessions and OTP tables

Revision ID: 039
Revises: 038
Create Date: 2026-04-14

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
    op.create_table(
        "login_2fa_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("temp_token_hash", sa.String(64), nullable=False),
        sa.Column("email_otp_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("phone_otp_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_login_2fa_sessions_user_id", "login_2fa_sessions", ["user_id"])
    op.create_index("ix_login_2fa_sessions_temp_token_hash", "login_2fa_sessions", ["temp_token_hash"], unique=True)

    op.create_table(
        "login_2fa_otps",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", UUID(as_uuid=True), nullable=False),
        sa.Column("otp_type", sa.String(10), nullable=False),
        sa.Column("otp_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["login_2fa_sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_login_2fa_otps_user_id", "login_2fa_otps", ["user_id"])
    op.create_index("ix_login_2fa_otps_session_id", "login_2fa_otps", ["session_id"])
    op.create_index("ix_login_2fa_otps_otp_type", "login_2fa_otps", ["otp_type"])
    op.create_index("ix_login_2fa_otps_otp_hash", "login_2fa_otps", ["otp_hash"])


def downgrade() -> None:
    op.drop_index("ix_login_2fa_otps_otp_hash", table_name="login_2fa_otps")
    op.drop_index("ix_login_2fa_otps_otp_type", table_name="login_2fa_otps")
    op.drop_index("ix_login_2fa_otps_session_id", table_name="login_2fa_otps")
    op.drop_index("ix_login_2fa_otps_user_id", table_name="login_2fa_otps")
    op.drop_table("login_2fa_otps")

    op.drop_index("ix_login_2fa_sessions_temp_token_hash", table_name="login_2fa_sessions")
    op.drop_index("ix_login_2fa_sessions_user_id", table_name="login_2fa_sessions")
    op.drop_table("login_2fa_sessions")
