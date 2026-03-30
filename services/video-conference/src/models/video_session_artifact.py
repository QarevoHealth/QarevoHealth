"""Video session artifact model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class VideoSessionArtifactDB(Base):
    """Artifact from video session (recording, transcript, etc.)."""

    __tablename__ = "video_session_artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_session_id = Column(
        UUID(as_uuid=True), ForeignKey("video_sessions.id", ondelete="CASCADE"), nullable=False
    )
    artifact_type = Column(String, nullable=True)
    s3_url = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    video_session = relationship("VideoSessionDB", back_populates="artifacts")
