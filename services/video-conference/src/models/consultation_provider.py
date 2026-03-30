"""Consultation-Provider junction model."""

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.database import Base


class ConsultationProviderDB(Base):
    """Links consultations to providers (many-to-many)."""

    __tablename__ = "consultations_providers"

    consultation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    role = Column(String, nullable=True)

    # Relationships
    consultation = relationship("ConsultationDB", back_populates="consultation_providers")
    provider = relationship("ProviderDB", back_populates="consultation_providers")
