"""Join video session use case - Return Chime payload for frontend init."""

from datetime import datetime, timezone
from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.chime_client import create_attendee, create_meeting_with_attendees, get_meeting
from src.config import config
from src.models import (
    ConsultationDB,
    ConsultationProviderDB,
    PatientDB,
    ProviderDB,
    UserDB,
    VideoSessionAttendeeDB,
    VideoSessionDB,
)
from src.models.schemas import VideoSessionJoinRequest, VideoSessionJoinResponse
from src.constants.meeting import CONFIG_MEETING


def _get_join_role(consultation: ConsultationDB, user_id: UUID, db: Session) -> str:
    """Return PATIENT or PROVIDER based on consultation membership."""
    patient = db.query(PatientDB).filter(PatientDB.id == consultation.patient_id).first()
    if patient and patient.user_id == user_id:
        return CONFIG_MEETING.ROLE.PATIENT
    provider_ids = [
        cp.provider_id for cp in db.query(ConsultationProviderDB)
        .filter(ConsultationProviderDB.consultation_id == consultation.id).all()
    ]
    if provider_ids:
        providers = db.query(ProviderDB).filter(ProviderDB.id.in_(provider_ids)).all()
        if any(p.user_id == user_id for p in providers):
            return CONFIG_MEETING.ROLE.PROVIDER
    return CONFIG_MEETING.ROLE.PROVIDER  # fallback (e.g. admin joining)


def _ensure_chime_meeting(
    consultation: ConsultationDB,
    video_session: VideoSessionDB,
    joining_user_id: UUID,
    role: str,
    db: Session,
) -> tuple[str, str, str, dict]:
    """
    Create or recreate Chime meeting for this consultation.
    Used for: lazy creation (no meeting_id) or recreate on NotFoundException.
    Returns: (meeting_id, attendee_id, join_token, media_placement)
    """
    external_meeting_id = str(consultation.id)
    attendees_payload = [{"external_user_id": str(joining_user_id), "role": role}]

    response = create_meeting_with_attendees(
        external_meeting_id=external_meeting_id,
        attendees=attendees_payload,
    )

    meeting = response["Meeting"]
    meeting_id = meeting["MeetingId"]
    media_placement = meeting.get("MediaPlacement", {})

    chime_attendees = response.get("Attendees", [])
    attendee = chime_attendees[0] if chime_attendees else None
    if not attendee:
        raise HTTPException(status_code=500, detail="Chime did not return attendee")

    attendee_id = attendee["AttendeeId"]
    join_token = attendee["JoinToken"]

    video_session.meeting_id = meeting_id
    video_session.status = CONFIG_MEETING.VIDEO_SESSION_STATUS.SCHEDULED

    db.query(VideoSessionAttendeeDB).filter(
        VideoSessionAttendeeDB.video_session_id == video_session.id
    ).delete()

    vs_attendee = VideoSessionAttendeeDB(
        video_session_id=video_session.id,
        participant_user_id=joining_user_id,
        participant_role=role,
        attendee_id=attendee_id,
        join_payload={"join_token": join_token, "attendee_id": attendee_id},
        joined_at=datetime.now(timezone.utc),
    )
    db.add(vs_attendee)
    db.commit()

    return meeting_id, attendee_id, join_token, media_placement


def execute(
    consultation_id: UUID,
    request: VideoSessionJoinRequest,
    db: Session,
) -> VideoSessionJoinResponse:
    """
    Join a video session for a consultation.
    Returns Chime payload (meeting + attendee) for frontend to initialize AWS Chime.

    Handles:
    - Lazy creation: creates Chime meeting when first user joins (if none exists)
    - Recreate on NotFound: if Chime meeting expired (5 min rule), creates new meeting
    """
    now = datetime.now(timezone.utc)

    consultation = db.query(ConsultationDB).filter(
        ConsultationDB.id == consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.consultation_id == consultation_id
    ).first()

    if not video_session:
        video_session = VideoSessionDB(
            consultation_id=consultation_id,
            meeting_id=None,
            status=CONFIG_MEETING.VIDEO_SESSION_STATUS.SCHEDULED,
        )
        db.add(video_session)
        db.flush()

    user = db.query(UserDB).filter(UserDB.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {request.user_id} not found")

    role = _get_join_role(consultation, request.user_id, db)
    meeting_id = video_session.meeting_id

    if not meeting_id:
        meeting_id, attendee_id, join_token, media_placement = _ensure_chime_meeting(
            consultation, video_session, request.user_id, role, db
        )
        if consultation.started_at is None:
            consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
            consultation.started_at = now
            video_session.started_at = now
            db.commit()
        join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"
        return VideoSessionJoinResponse(
            meeting_id=meeting_id,
            attendee_id=attendee_id,
            join_token=join_token,
            media_placement=media_placement,
            join_url=join_url,
        )

    existing = db.query(VideoSessionAttendeeDB).filter(
        VideoSessionAttendeeDB.video_session_id == video_session.id,
        VideoSessionAttendeeDB.participant_user_id == request.user_id,
    ).first()

    def _try_get_join_payload():
        if existing and existing.attendee_id and existing.join_payload:
            join_token = existing.join_payload.get("join_token") or existing.join_payload.get("attendee_id")
            if join_token:
                meeting = get_meeting(meeting_id)
                media_placement = meeting.get("MediaPlacement", {})
                if consultation.started_at is None:
                    consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
                    consultation.started_at = now
                    video_session.started_at = now
                if existing.joined_at is None:
                    existing.joined_at = now
                db.commit()
                return VideoSessionJoinResponse(
                    meeting_id=meeting_id,
                    attendee_id=existing.attendee_id,
                    join_token=join_token,
                    media_placement=media_placement,
                    join_url=f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={existing.attendee_id}",
                )

        response = create_attendee(meeting_id=meeting_id, external_user_id=str(request.user_id))
        attendee = response["Attendee"]
        join_token = attendee["JoinToken"]
        attendee_id = attendee["AttendeeId"]

        vs_attendee = VideoSessionAttendeeDB(
            video_session_id=video_session.id,
            participant_user_id=request.user_id,
            participant_role=role,
            attendee_id=attendee_id,
            join_payload={"join_token": join_token, "attendee_id": attendee_id},
            joined_at=now,
        )
        db.add(vs_attendee)
        if consultation.started_at is None:
            consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
            consultation.started_at = now
            video_session.started_at = now
        db.commit()

        meeting = get_meeting(meeting_id)
        media_placement = meeting.get("MediaPlacement", {})
        join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"
        return VideoSessionJoinResponse(
            meeting_id=meeting_id,
            attendee_id=attendee_id,
            join_token=join_token,
            media_placement=media_placement,
            join_url=join_url,
        )

    try:
        return _try_get_join_payload()
    except ClientError as e:
        # Fix #2: Chime meeting missing (expired 5-min rule, deleted, etc.)
        # Create new meeting, update DB, retry attendee creation, proceed
        if e.response.get("Error", {}).get("Code") != "NotFoundException":
            raise
        meeting_id, attendee_id, join_token, media_placement = _ensure_chime_meeting(
            consultation, video_session, request.user_id, role, db
        )
        if consultation.started_at is None:
            consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
            consultation.started_at = now
            video_session.started_at = now
            db.commit()
        join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"
        return VideoSessionJoinResponse(
            meeting_id=meeting_id,
            attendee_id=attendee_id,
            join_token=join_token,
            media_placement=media_placement,
            join_url=join_url,
        )
