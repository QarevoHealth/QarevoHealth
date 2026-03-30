"""Patient insurance model - eGK / German health insurance."""

import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class PatientInsuranceDB(Base):
    """eGK / German health insurance - one row per patient (1:1)."""

    __tablename__ = "patient_insurance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    insured_person_full_name = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    insurance_number = Column(String(50), nullable=True, index=True)
    insurance_provider_name = Column(String(100), nullable=True)
    insurance_provider_id = Column(String(20), nullable=True)
    card_access_number = Column(String(6), nullable=True)
    insured_status = Column(String(50), nullable=True)
    validity_start = Column(Date, nullable=True)
    validity_end = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patient = relationship("PatientDB", back_populates="patient_insurance", uselist=False)


class InsuredStatus:
    """Insured status enum values."""

    SELF_INSURED = "SELF_INSURED"
    FAMILY_MEMBER = "FAMILY_MEMBER"
    STUDENT = "STUDENT"
    PENSIONER = "PENSIONER"
    OTHER = "OTHER"
