"""Request/Response DTOs for Chime meetings."""

from typing import List
from pydantic import BaseModel, Field


# Request DTOs
class AttendeeInput(BaseModel):
    """Attendee to add to meeting."""
    external_user_id: str = Field(..., description="User identifier (e.g. doctor123, patient456)")
    role: str = Field(default="participant", description="Role: doctor, patient, participant")


class CreateMeetingRequest(BaseModel):
    """Request to create a meeting."""
    attendees: List[AttendeeInput] = Field(..., min_length=1, description="List of participants")


class JoinMeetingRequest(BaseModel):
    """Request to join an existing meeting."""
    external_user_id: str = Field(..., description="User identifier for the joining attendee")


# Response DTOs
class AttendeeJoinInfo(BaseModel):
    """Join info for one attendee."""
    external_user_id: str
    attendee_id: str
    join_token: str
    join_url: str


class CreateMeetingResponse(BaseModel):
    """Response after creating a meeting."""
    meeting_id: str
    external_meeting_id: str
    media_region: str
    attendees: List[AttendeeJoinInfo]
    message: str = "Meeting created successfully"


class JoinMeetingResponse(BaseModel):
    """Response with join link for an attendee."""
    meeting_id: str
    attendee_id: str
    join_token: str
    join_url: str
    message: str = "Use join_url to join the meeting"


class EndMeetingResponse(BaseModel):
    """Response after ending a meeting."""
    meeting_id: str
    message: str = "Meeting ended successfully"
