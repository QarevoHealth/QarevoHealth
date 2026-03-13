"""User consent model - TERMS, PRIVACY, TELEHEALTH, MARKETING."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class UserConsentDB(Base):
    """Stores consent records with audit trail."""

    __tablename__ = "user_consents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)
    accepted = Column(Boolean, nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    version = Column(String(20), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("UserDB", backref="user_consents")


class ConsentType:
    """Consent type constants."""

    TERMS_PRIVACY = "TERMS_PRIVACY"
    TELEHEALTH = "TELEHEALTH"
    MARKETING = "MARKETING"
