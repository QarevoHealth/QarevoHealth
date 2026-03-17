"""Video session attendee model."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class VideoSessionAttendeeDB(Base):
    """Attendee in a video session (Chime join payload)."""

    __tablename__ = "video_session_attendees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_session_id = Column(
        UUID(as_uuid=True), ForeignKey("video_sessions.id", ondelete="CASCADE"), nullable=False
    )
    participant_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    participant_role = Column(String, nullable=True)
    attendee_id = Column(String, nullable=True, index=True)
    join_payload = Column(JSON, nullable=True)
    joined_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    video_session = relationship("VideoSessionDB", back_populates="attendees")
    participant_user = relationship("UserDB", back_populates="video_session_attendees")
