"""Patient intake model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class PatientIntakeDB(Base):
    """Patient intake answers for a consultation."""

    __tablename__ = "patient_intakes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(
        UUID(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    answers_json = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    status = Column(String(20), nullable=False, server_default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    consultation = relationship("ConsultationDB", back_populates="intakes")
    episode_pack_version_id = Column(UUID(as_uuid=True), ForeignKey("episode_pack_versions.id"), nullable=False, index=True)
    episode_pack_version = relationship("EpisodePackVersionDB", back_populates="patient_intakes")
