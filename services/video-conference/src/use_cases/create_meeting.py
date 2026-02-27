"""Schedule consultation use case - stores appointment/consultation only.
Chime meeting is created lazily when first participant joins (see join_video_session).
"""

from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.models import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    AppointmentDB,
    AppointmentProviderDB,
    ConsultationDB,
    ConsultationProviderDB,
    VideoSessionDB,
    PatientDB,
    ProviderDB,
)
from src.constants.meeting import CONFIG_MEETING


def execute(request: CreateMeetingRequest, db: Session) -> CreateMeetingResponse:
    """Schedule a consultation - store appointment/consultation record only.
    No Chime meeting is created. Meeting + attendees are created at join time.
    """
    # 1. Validate patient exists
    patient = db.query(PatientDB).filter(PatientDB.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {request.patient_id} not found")

    # 2. Validate all providers exist and collect user_ids
    providers = db.query(ProviderDB).filter(ProviderDB.id.in_(request.provider_ids)).all()
    if len(providers) != len(request.provider_ids):
        found_ids = {p.id for p in providers}
        missing = set(request.provider_ids) - found_ids
        raise HTTPException(status_code=404, detail=f"Providers not found: {missing}")

    patient_user_id = patient.user_id

    # 4. Create consultation (time, participants, status - no Chime yet)
    consultation = ConsultationDB(
        patient_id=request.patient_id,
        status=CONFIG_MEETING.CONSULTATION_STATUS.SCHEDULED,
        scheduled_at=request.scheduled_at,
        created_by_user_id=patient_user_id,
    )
    db.add(consultation)
    db.flush()

    # 5. New consultation = new appointment + appointment_providers
    start_at = request.start_at or request.scheduled_at
    if not start_at:
        raise HTTPException(
            status_code=400,
            detail="start_at or scheduled_at required",
        )
    end_at = request.end_at or (start_at + timedelta(minutes=60))
    appointment = AppointmentDB(
        patient_id=request.patient_id,
        start_at=start_at,
        end_at=end_at,
        consultation_id=consultation.id,
        status=CONFIG_MEETING.APPOINTMENT_STATUS.SCHEDULED,
        created_by_user_id=patient_user_id,
    )
    db.add(appointment)
    db.flush()
    for provider in providers:
        ap = AppointmentProviderDB(
            appointment_id=appointment.id,
            provider_id=provider.id,
            role=CONFIG_MEETING.ROLE.PRIMARY,
        )
        db.add(ap)

    # 7. Link providers to consultation and every provider is considered as primary doctor need to cover it in next sprint
    for provider in providers:
        cp = ConsultationProviderDB(
            consultation_id=consultation.id,
            provider_id=provider.id,
            role=CONFIG_MEETING.ROLE.PRIMARY,
        )
        db.add(cp)

    # 8. Create video session with meeting_id=None (Chime meeting created at join time)
    video_session = VideoSessionDB(
        consultation_id=consultation.id,
        meeting_id=None,
        status=CONFIG_MEETING.VIDEO_SESSION_STATUS.SCHEDULED,
    )
    db.add(video_session)

    db.commit()

    return CreateMeetingResponse(
        consultation_id=consultation.id,
        meeting_id=None,
        external_meeting_id=str(consultation.id),
        media_region=None,
        attendees=[],
    )
