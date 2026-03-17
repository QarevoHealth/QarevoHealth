"""Provider model."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class ProviderDB(Base):
    """Provider (doctor) profile."""

    __tablename__ = "providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    specialty = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    license_number = Column(String, nullable=True)
    is_independent = Column(Boolean, nullable=True, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("UserDB", back_populates="provider")
    consultation_providers = relationship("ConsultationProviderDB", back_populates="provider")
    appointment_providers = relationship("AppointmentProviderDB", back_populates="provider")
