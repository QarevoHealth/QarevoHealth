"""User identity model - links users to auth providers (email, google, github, apple)."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class UserIdentityDB(Base):
    """Links a user to an auth provider (email, google, github, apple)."""

    __tablename__ = "user_identities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)
    provider_subject = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="identities")


# Provider constants for use in code
class AuthProvider:
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"
    APPLE = "apple"
