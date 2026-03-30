"""Request/Response DTOs for Chime meetings."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from src.constants.meeting import CONFIG_MEETING


# Request DTOs
class AttendeeInput(BaseModel):
    """Attendee to add to meeting (legacy - use patient_id/provider_ids for full flow)."""

    external_user_id: str = Field(
        ..., description="User identifier (e.g. doctor123, patient456)"
    )
    role: str = Field(
        default=CONFIG_MEETING.ROLE.PROVIDER,
        description="Role: PATIENT or PROVIDER",
    )


class CreateMeetingRequest(BaseModel):
    """Request to schedule a consultation. New consultation = new appointment."""

    patient_id: UUID = Field(..., description="Patient UUID (from patients table)")
    provider_ids: List[UUID] = Field(
        ..., min_length=1, description="Provider UUIDs (doctors)"
    )
    scheduled_at: Optional[datetime] = Field(
        None, description="Scheduled consultation time"
    )
    start_at: Optional[datetime] = Field(
        None, description="Appointment start (default: scheduled_at)"
    )
    end_at: Optional[datetime] = Field(
        None, description="Appointment end (default: start_at + 60 min)"
    )


class JoinMeetingRequest(BaseModel):
    """Request to join an existing meeting."""

    external_user_id: str = Field(
        ..., description="User identifier for the joining attendee"
    )


# Response DTOs
class AttendeeJoinInfo(BaseModel):
    """Join info for one attendee."""

    user_id: UUID = Field(..., description="User UUID (patient or provider)")
    participant_role: str = Field(
        ..., description="PATIENT or PROVIDER (see CONFIG_MEETING.ROLE)"
    )
    attendee_id: str = Field(..., description="Chime attendee ID")
    join_token: str = Field(..., description="Chime join token")
    join_url: str = Field(..., description="Full URL to join the meeting")


class CreateMeetingResponse(BaseModel):
    """Response after scheduling a consultation.
    Chime meeting is created lazily at join time - no meeting_id/attendees until first join.
    """

    consultation_id: UUID = Field(
        ..., description="Consultation UUID for GET /consultations/{id})"
    )
    meeting_id: Optional[str] = Field(
        None,
        description="Chime meeting ID (None until first participant joins)",
    )
    external_meeting_id: Optional[str] = Field(
        None,
        description="External meeting ID (same as consultation_id)",
    )
    media_region: Optional[str] = Field(
        None,
        description="AWS media region (set when meeting is created at join)",
    )
    attendees: List[AttendeeJoinInfo] = Field(
        default_factory=list,
        description="Join info per participant (empty until join - use video-session/join)",
    )
    message: str = "Consultation scheduled. Join via POST /consultations/{id}/video-session/join"


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
    participant_role: str = Field(
        ..., description="PATIENT or PROVIDER (see CONFIG_MEETING.ROLE)"
    )
    joined_at: Optional[datetime] = Field(None, description="When the attendee joined")
    full_name: Optional[str] = Field(None, description="User full name")
    email: Optional[str] = Field(None, description="User email")


class ConsultationResponse(BaseModel):
    """Consultation metadata for lobby and state transitions."""

    consultation_id: UUID = Field(..., description="Consultation UUID")
    patient_id: UUID = Field(..., description="Patient UUID")
    status: Optional[str] = Field(
        None,
        description="SCHEDULED, STARTED, ENDED, CANCELLED (see CONFIG_MEETING.CONSULTATION_STATUS)",
    )
    scheduled_at: Optional[datetime] = Field(
        None, description="Scheduled consultation time"
    )
    started_at: Optional[datetime] = Field(
        None, description="When consultation started"
    )
    ended_at: Optional[datetime] = Field(None, description="When consultation ended")
    appointment_id: Optional[UUID] = Field(None, description="Linked appointment UUID")
    meeting_id: Optional[str] = Field(None, description="Chime meeting ID")
    joined_attendees: List[JoinedAttendeeDetail] = Field(
        default_factory=list,
        description="Attendees who have joined (joined_at set)",
    )


# Consultation providers response (clinician identity for lobby/in-call UI)
class ConsultationProviderDetail(BaseModel):
    """Provider details for consultation - clinician identity in lobby/in-call UI."""

    provider_id: UUID = Field(..., description="Provider UUID")
    user_id: UUID = Field(..., description="User UUID")
    full_name: Optional[str] = Field(None, description="Display name")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")
    role: Optional[str] = Field(None, description="e.g. PRIMARY")
    specialty: Optional[str] = Field(None, description="Clinician specialty")
    experience_years: Optional[int] = Field(None, description="Years of experience")
    license_number: Optional[str] = Field(None, description="License number")
    is_independent: Optional[bool] = Field(
        None, description="Independent provider flag"
    )
    avatar_url: Optional[str] = Field(None, description="Avatar/profile image URL")


class ConsultationProvidersResponse(BaseModel):
    """Providers for a consultation - clinician identity for lobby/in-call UI."""

    consultation_id: UUID = Field(..., description="Consultation UUID")
    providers: List[ConsultationProviderDetail] = Field(
        default_factory=list,
        description="Clinicians for this consultation",
    )


# Video session join (Chime payload for frontend)
class VideoSessionJoinRequest(BaseModel):
    """Request to join a video session - user identity."""

    user_id: UUID = Field(
        ..., description="User UUID (patient or provider) joining the session"
    )


class VideoSessionJoinResponse(BaseModel):
    """Join payload for AWS Chime - meeting + attendee for frontend init."""

    meeting_id: str = Field(..., description="Chime meeting ID")
    attendee_id: str = Field(..., description="Chime attendee ID")
    join_token: str = Field(..., description="Chime join token")
    media_placement: Optional[dict] = Field(
        None,
        description="Chime MediaPlacement URLs for SDK init (AudioHostUrl, SignalingUrl, etc.)",
    )
    join_url: str = Field(..., description="Full URL to join (convenience)")

    # Video session end


class VideoSessionEndRequest(BaseModel):
    """Request to end a video session."""

    consultation_id: UUID = Field(..., description="Consultation UUID")


class VideoSessionEndResponse(BaseModel):
    """Response after ending a video session."""

    consultation_id: UUID = Field(..., description="Consultation UUID")
