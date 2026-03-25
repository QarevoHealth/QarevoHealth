"""Consultations API - consultation metadata for lobby and state transitions."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from src.api.errors import handle_aws_error
from src.database import get_db
from src.constants.meeting import CONFIG_MEETING
from src.models import (
    ConsultationDB,
    ConsultationProviderDB,
    ConsultationProviderDetail,
    ConsultationProvidersResponse,
    ConsultationResponse,
    JoinedAttendeeDetail,
    ProviderDB,
    VideoSessionAttendeeDB,
    VideoSessionJoinRequest,
    VideoSessionJoinResponse,
    VideoSessionEndRequest,
    VideoSessionEndResponse,
)
from src.use_cases.join_video_session import execute as join_video_session
from src.use_cases.end_video_session import execute as end_video_session

router = APIRouter(prefix="/api/v1/consultations", tags=["consultations"])


@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation_api(consultation_id: UUID, db: Session = Depends(get_db)):
    """
    Get consultation metadata for lobby and state transitions.
    Includes scheduled time, status, identifiers, and who has joined.
    Uses Option 1: direct video_sessions query by consultation_id (minimal DB load).
    """
    consultation = (
        db.query(ConsultationDB)
        .options(
            joinedload(ConsultationDB.video_sessions),
            joinedload(ConsultationDB.appointment),
        )
        .filter(ConsultationDB.id == consultation_id)
        .first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    video_session = consultation.video_sessions[0] if consultation.video_sessions else None
    appointment_id = consultation.appointment.id if consultation.appointment else None

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
                participant_role=a.participant_role or CONFIG_MEETING.ROLE.PROVIDER,
                joined_at=a.joined_at,
                full_name=f"{a.participant_user.first_name} {a.participant_user.last_name}".strip() if a.participant_user else None,
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


@router.get("/{consultation_id}/providers", response_model=ConsultationProvidersResponse)
def get_consultation_providers_api(consultation_id: UUID, db: Session = Depends(get_db)):
    """
    Get provider details for a consultation.
    Clinician identity for lobby/in-call UI (name, specialty, avatar/contact fields).
    """
    consultation = db.query(ConsultationDB).filter(
        ConsultationDB.id == consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    cp_list = (
        db.query(ConsultationProviderDB)
        .options(
            joinedload(ConsultationProviderDB.provider).joinedload(ProviderDB.user),
        )
        .filter(ConsultationProviderDB.consultation_id == consultation_id)
        .all()
    )

    providers: List[ConsultationProviderDetail] = []
    for cp in cp_list:
        p = cp.provider
        u = p.user if p else None
        providers.append(
            ConsultationProviderDetail(
                provider_id=p.id,
                user_id=p.user_id,
                full_name=f"{u.first_name} {u.last_name}".strip() if u else None,
                email=u.email if u else None,
                phone=u.phone if u else None,
                role=cp.role,
                specialty=p.specialty,
                experience_years=p.experience_years,
                license_number=p.license_number,
                is_independent=p.is_independent,
                avatar_url=None,
            )
        )

    return ConsultationProvidersResponse(
        consultation_id=consultation_id,
        providers=providers,
    )


@router.post(
    "/{consultation_id}/video-session/join",
    response_model=VideoSessionJoinResponse,
    status_code=201,
)
def join_video_session_api(
    consultation_id: UUID,
    request: VideoSessionJoinRequest,
    db: Session = Depends(get_db),
):
    """
    Join video session - returns Chime payload for frontend to initialize AWS Chime.
    Meeting/session state is owned by backend (persisted server-side).
    Frontend receives only the join payload (meeting_id, attendee_id, join_token, media_placement).
    """
    try:
        return join_video_session(consultation_id, request, db)
    except HTTPException:
        raise
    except Exception as e:
        handle_aws_error(e)
    

@router.post(
    "/{consultation_id}/video-session/end",
    response_model=VideoSessionEndResponse,
    status_code=200,
)
def end_video_session_api(
    consultation_id: UUID,
    request: VideoSessionEndRequest,
    db: Session = Depends(get_db),
):
    """
    End video session - deletes Chime meeting and updates consultation, video session,
    and linked appointment status.
    """
    try:
        return end_video_session(consultation_id, db)
    except HTTPException:
        raise
    except Exception as e:
        handle_aws_error(e)
