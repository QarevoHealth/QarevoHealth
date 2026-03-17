"""Video session model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class VideoSessionDB(Base):
    """Video session (Chime meeting per consultation)."""

    __tablename__ = "video_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(
        UUID(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id = Column(String, nullable=True, index=True)
    status = Column(String, nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    consultation = relationship("ConsultationDB", back_populates="video_sessions")
    attendees = relationship("VideoSessionAttendeeDB", back_populates="video_session")
    artifacts = relationship("VideoSessionArtifactDB", back_populates="video_session")
