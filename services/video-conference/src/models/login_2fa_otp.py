"""Login 2FA OTP model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class Login2FAOtpDB(Base):
    """Stores email/phone OTP codes associated with a login 2FA session."""

    __tablename__ = "login_2fa_otps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("login_2fa_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    otp_type = Column(String(10), nullable=False, index=True)  # EMAIL or PHONE
    otp_hash = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="login_2fa_otps")
    session = relationship("Login2FASessionDB", backref="otps")
