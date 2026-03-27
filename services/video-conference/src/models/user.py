"""User model."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class UserDB(Base):
    """User account (auth, identity)."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    email_verified = Column(Boolean, nullable=False, default=False)
    phone = Column(String, nullable=True)
    password_hash = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("TenantDB", back_populates="users")
    patient = relationship("PatientDB", back_populates="user", uselist=False)
    provider = relationship("ProviderDB", back_populates="user", uselist=False)
    video_session_attendees = relationship("VideoSessionAttendeeDB", back_populates="participant_user")
