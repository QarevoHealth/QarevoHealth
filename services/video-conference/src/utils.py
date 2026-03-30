"""Shared utilities for video conference service."""

from uuid import UUID

from sqlalchemy.orm import Session

from src.config import config
from src.constants.meeting import CONFIG_MEETING
from src.models import ConsultationDB, ConsultationProviderDB, PatientDB, ProviderDB
from src.models.schemas import VideoSessionJoinResponse


def build_join_url(meeting_id: str, join_token: str, attendee_id: str) -> str:
    """Build full join URL for frontend."""
    return f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"


def build_join_response(
    meeting_id: str,
    attendee_id: str,
    join_token: str,
    media_placement: dict,
) -> VideoSessionJoinResponse:
    """Build VideoSessionJoinResponse from Chime payload."""
    return VideoSessionJoinResponse(
        meeting_id=meeting_id,
        attendee_id=attendee_id,
        join_token=join_token,
        media_placement=media_placement,
        join_url=build_join_url(meeting_id, join_token, attendee_id),
    )


def get_join_role(consultation: ConsultationDB, user_id: UUID, db: Session | None = None) -> str:
    """Return PATIENT or PROVIDER. Use joinedload(patient), joinedload(consultation_providers).joinedload(provider)
    when loading consultation to avoid extra queries. Pass db only when not pre-loaded.
    """
    patient = consultation.patient if db is None else db.query(PatientDB).filter(PatientDB.id == consultation.patient_id).first()
    if patient and patient.user_id == user_id:
        return CONFIG_MEETING.ROLE.PATIENT

    cp_list = consultation.consultation_providers if db is None else db.query(ConsultationProviderDB).filter(
        ConsultationProviderDB.consultation_id == consultation.id
    ).all()
    for cp in cp_list or []:
        p = cp.provider
        if p and p.user_id == user_id:
            return CONFIG_MEETING.ROLE.PROVIDER

    return CONFIG_MEETING.ROLE.PROVIDER


