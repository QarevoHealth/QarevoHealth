"""Consultations API - consultation metadata for lobby and state transitions."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from src.database import get_db
from src.models import (
    AppointmentDB,
    ConsultationDB,
    ConsultationResponse,
    JoinedAttendeeDetail,
    VideoSessionDB,
    VideoSessionAttendeeDB,
)

router = APIRouter(prefix="/api/v1/consultations", tags=["consultations"])


@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation_api(consultation_id: UUID, db: Session = Depends(get_db)):
    """
    Get consultation metadata for lobby and state transitions.
    Includes scheduled time, status, identifiers, and who has joined.
    Uses Option 1: direct video_sessions query by consultation_id (minimal DB load).
    """
    # 1. Load consultation (needed for metadata)
    consultation = db.query(ConsultationDB).filter(
        ConsultationDB.id == consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # 2. Option 1: Direct query video_sessions by consultation_id (indexed)
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.consultation_id == consultation_id
    ).first()

    # 3. Get appointment_id if linked
    appointment_id = None
    appointment = db.query(AppointmentDB).filter(
        AppointmentDB.consultation_id == consultation_id
    ).first()
    if appointment:
        appointment_id = appointment.id

    # 4. Get joined attendees with user details (joinedload avoids N+1)
    joined_attendees: List[JoinedAttendeeDetail] = []
    if video_session:
        attendees = (
            db.query(VideoSessionAttendeeDB)
            .options(joinedload(VideoSessionAttendeeDB.participant_user))
            .filter(
                VideoSessionAttendeeDB.video_session_id == video_session.id,
                VideoSessionAttendeeDB.joined_at.isnot(None),
            )
            .all()
        )
        joined_attendees = [
            JoinedAttendeeDetail(
                attendee_id=a.attendee_id or "",
                participant_user_id=a.participant_user_id,
                participant_role=a.participant_role or "participant",
                joined_at=a.joined_at,
                full_name=a.participant_user.full_name if a.participant_user else None,
                email=a.participant_user.email if a.participant_user else None,
            )
            for a in attendees
        ]

    return ConsultationResponse(
        consultation_id=consultation.id,
        patient_id=consultation.patient_id,
        status=consultation.status,
        scheduled_at=consultation.scheduled_at,
        started_at=consultation.started_at,
        ended_at=consultation.ended_at,
        appointment_id=appointment_id,
        meeting_id=video_session.meeting_id if video_session else None,
        joined_attendees=joined_attendees,
    )
