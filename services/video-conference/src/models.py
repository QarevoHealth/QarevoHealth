"""All models - entities and DTOs."""

from dataclasses import dataclass
from datetime import datetime
from typing import List
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from src.database import Base


# Database Model
class SessionDB(Base):
    """Database table for sessions."""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    host_id = Column(String, nullable=False, index=True)
    participants = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False, default="created")


# Domain Models
@dataclass
class Participant:
    """Participant in a video session."""
    user_id: str
    role: str


@dataclass
class Session:
    """Video conference session."""
    id: str
    host_id: str
    participants: List[Participant]
    created_at: datetime
    status: str

    @classmethod
    def create(cls, host_id: str, attendee_id: str) -> "Session":
        """Create a new session with host and attendee."""
        return cls(
            id=str(uuid4()),
            host_id=host_id,
            participants=[
                Participant(user_id=host_id, role="doctor"),
                Participant(user_id=attendee_id, role="patient")
            ],
            created_at=datetime.utcnow(),
            status="created"
        )


# DTOs
@dataclass
class CreateMeetingRequest:
    """Request to create a meeting."""
    host_id: str
    attendee_id: str


@dataclass
class ParticipantResponse:
    """Participant in response."""
    user_id: str
    role: str


@dataclass
class CreateMeetingResponse:
    """Response after creating a meeting."""
    session_id: str
    host_id: str
    participants: List[ParticipantResponse]
    status: str
    message: str = "Meeting created successfully"
