"""Join video session use case - Return Chime payload for frontend init."""

from datetime import datetime, timezone
from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from src.chime_client import create_attendee, create_meeting_with_attendees, get_meeting
from src.models import (
    ConsultationDB,
    ConsultationProviderDB,
    UserDB,
    VideoSessionAttendeeDB,
    VideoSessionDB,
)
from src.models.schemas import VideoSessionJoinRequest, VideoSessionJoinResponse
from src.constants.meeting import CONFIG_MEETING
from src.utils import build_join_response, get_join_role


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

    consultation = (
        db.query(ConsultationDB)
        .options(
            joinedload(ConsultationDB.patient),
            joinedload(ConsultationDB.consultation_providers).joinedload(ConsultationProviderDB.provider),
            joinedload(ConsultationDB.video_sessions),
        )
        .filter(ConsultationDB.id == consultation_id)
        .first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    video_session = consultation.video_sessions[0] if consultation.video_sessions else None

    if not video_session:
        video_session = VideoSessionDB(
            consultation_id=consultation_id,
            meeting_id=None,
            status=CONFIG_MEETING.VIDEO_SESSION_STATUS.SCHEDULED,
        )
        db.add(video_session)
        db.flush()  # Required: need video_session.id for _ensure_chime_meeting

    user = db.query(UserDB).filter(UserDB.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {request.user_id} not found")

    role = get_join_role(consultation, request.user_id)
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
        return build_join_response(meeting_id, attendee_id, join_token, media_placement)

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
                return build_join_response(
                    meeting_id, existing.attendee_id, join_token, media_placement
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
        return build_join_response(meeting_id, attendee_id, join_token, media_placement)

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
        return build_join_response(meeting_id, attendee_id, join_token, media_placement)
