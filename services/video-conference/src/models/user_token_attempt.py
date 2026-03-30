"""User token attempt model - tracks failed verification/reset attempts."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base
from src.models.token_constants import AttemptType, TokenType


class UserTokenAttemptDB(Base):
    """Tracks failed verification/reset attempts (wrong token submitted)."""

    __tablename__ = "user_token_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_type = Column(String(50), nullable=False)
    attempt_type = Column(String(50), nullable=False)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="user_token_attempts")
