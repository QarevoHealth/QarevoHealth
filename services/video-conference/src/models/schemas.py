"""Request/Response DTOs for Chime meetings."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


# Request DTOs
class AttendeeInput(BaseModel):
    """Attendee to add to meeting (legacy - use patient_id/provider_ids for full flow)."""
    external_user_id: str = Field(..., description="User identifier (e.g. doctor123, patient456)")
    role: str = Field(default="participant", description="Role: doctor, patient, participant")


class CreateMeetingRequest(BaseModel):
    """Request to create a meeting with doctor and patient details stored in DB."""
    patient_id: UUID = Field(..., description="Patient UUID (from patients table)")
    provider_ids: List[UUID] = Field(..., min_length=1, description="Provider UUIDs (doctors)")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled consultation time")
    appointment_id: Optional[UUID] = Field(None, description="Existing appointment UUID - links consultation to it")
    start_at: Optional[datetime] = Field(None, description="Appointment start (required when creating new appointment)")
    end_at: Optional[datetime] = Field(None, description="Appointment end (default: start_at + 30 min)")


class JoinMeetingRequest(BaseModel):
    """Request to join an existing meeting."""
    external_user_id: str = Field(..., description="User identifier for the joining attendee")


# Response DTOs
class AttendeeJoinInfo(BaseModel):
    """Join info for one attendee."""
    user_id: UUID = Field(..., description="User UUID (patient or provider)")
    participant_role: str = Field(..., description="patient or provider")
    attendee_id: str = Field(..., description="Chime attendee ID")
    join_token: str = Field(..., description="Chime join token")
    join_url: str = Field(..., description="Full URL to join the meeting")


class CreateMeetingResponse(BaseModel):
    """Response after creating a meeting."""
    consultation_id: UUID = Field(..., description="Consultation UUID for GET /consultations/{id})")
    meeting_id: str = Field(..., description="Chime meeting ID")
    external_meeting_id: str = Field(..., description="External meeting ID")
    media_region: str = Field(..., description="AWS media region")
    attendees: List[AttendeeJoinInfo] = Field(..., description="Join info per participant")
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


# Consultation response DTOs
class JoinedAttendeeDetail(BaseModel):
    """Attendee who has joined the video session."""
    attendee_id: str = Field(..., description="Chime attendee ID")
    participant_user_id: UUID = Field(..., description="User UUID")
    participant_role: str = Field(..., description="patient or provider")
    joined_at: Optional[datetime] = Field(None, description="When the attendee joined")
    full_name: Optional[str] = Field(None, description="User full name")
    email: Optional[str] = Field(None, description="User email")


class ConsultationResponse(BaseModel):
    """Consultation metadata for lobby and state transitions."""
    consultation_id: UUID = Field(..., description="Consultation UUID")
    patient_id: UUID = Field(..., description="Patient UUID")
    status: Optional[str] = Field(None, description="scheduled, IN_PROGRESS, ended")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled consultation time")
    started_at: Optional[datetime] = Field(None, description="When consultation started")
    ended_at: Optional[datetime] = Field(None, description="When consultation ended")
    appointment_id: Optional[UUID] = Field(None, description="Linked appointment UUID")
    meeting_id: Optional[str] = Field(None, description="Chime meeting ID")
    joined_attendees: List[JoinedAttendeeDetail] = Field(
        default_factory=list,
        description="Attendees who have joined (joined_at set)",
    )
