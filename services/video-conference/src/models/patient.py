"""Patient model."""

import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class PatientDB(Base):
    """Patient profile."""

    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    external_patient_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("UserDB", back_populates="patient")
    patient_insurance = relationship("PatientInsuranceDB", back_populates="patient", uselist=False)
    consultations = relationship("ConsultationDB", back_populates="patient")
    appointments = relationship("AppointmentDB", back_populates="patient")
