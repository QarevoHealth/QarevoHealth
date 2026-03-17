"""Appointment-Provider junction model."""

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.database import Base


class AppointmentProviderDB(Base):
    """Links appointments to providers (many-to-many)."""

    __tablename__ = "appointments_providers"

    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    role = Column(String, nullable=False, default="PRIMARY")

    # Relationships
    appointment = relationship("AppointmentDB", back_populates="appointment_providers")
    provider = relationship("ProviderDB", back_populates="appointment_providers")
