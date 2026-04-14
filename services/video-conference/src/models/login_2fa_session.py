"""Login 2FA session model."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class Login2FASessionDB(Base):
    """Tracks temporary 2FA challenges created after doctor credential login."""

    __tablename__ = "login_2fa_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    temp_token_hash = Column(String(64), nullable=False, unique=True, index=True)
    email_otp_verified = Column(Boolean, nullable=False, default=False)
    phone_otp_verified = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="login_2fa_sessions")
