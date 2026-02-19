"""Appointment model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class AppointmentDB(Base):
    """Appointment (scheduled slot)."""

    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    consultation_id = Column(
        UUID(as_uuid=True), ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    status = Column(String, nullable=False, default="BOOKED", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("PatientDB", back_populates="appointments")
    consultation = relationship("ConsultationDB", back_populates="appointment")
    appointment_providers = relationship("AppointmentProviderDB", back_populates="appointment")
