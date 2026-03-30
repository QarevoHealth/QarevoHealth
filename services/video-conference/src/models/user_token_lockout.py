"""User token lockout model - tracks 1-day lock when user exceeds 3 attempts per day."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base
from src.models.token_constants import TokenType


class UserTokenLockoutDB(Base):
    """Tracks lock periods when user cannot resend or retry (3 attempts exceeded)."""

    __tablename__ = "user_token_lockouts"
    __table_args__ = (UniqueConstraint("user_id", "token_type", name="uq_user_token_lockouts_user_id_token_type"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_type = Column(String(50), nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="user_token_lockouts")
