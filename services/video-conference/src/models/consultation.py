"""Consultation model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class ConsultationDB(Base):
    """Consultation (actual encounter)."""

    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=True, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("PatientDB", back_populates="consultations")
    consultation_providers = relationship("ConsultationProviderDB", back_populates="consultation")
    video_sessions = relationship("VideoSessionDB", back_populates="consultation")
    appointment = relationship("AppointmentDB", back_populates="consultation", uselist=False)
