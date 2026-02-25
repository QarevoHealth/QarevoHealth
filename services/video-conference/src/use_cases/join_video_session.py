"""Join video session use case - Return Chime payload for frontend init."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.chime_client import create_attendee, get_meeting
from src.config import config
from src.models import (
    ConsultationDB,
    UserDB,
    VideoSessionAttendeeDB,
    VideoSessionDB,
)
from src.models.schemas import VideoSessionJoinRequest, VideoSessionJoinResponse
from src.constants.meeting import CONFIG_MEETING


def execute(
    consultation_id: UUID,
    request: VideoSessionJoinRequest,
    db: Session,
) -> VideoSessionJoinResponse:
    """
    Join a video session for a consultation.
    Returns Chime payload (meeting + attendee) for frontend to initialize AWS Chime.
    Consultation: started when first person joins. Appointment: SCHEDULED → COMPLETED.
    """
    now = datetime.now(timezone.utc)

    # 1. Validate consultation exists
    consultation = db.query(ConsultationDB).filter(
        ConsultationDB.id == consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # 2. Get video session by consultation_id
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.consultation_id == consultation_id
    ).first()
    if not video_session:
        raise HTTPException(
            status_code=404,
            detail="Video session not found for this consultation",
        )

    meeting_id = video_session.meeting_id
    if not meeting_id:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found for this consultation",
        )

    # 3. Validate user exists
    user = db.query(UserDB).filter(UserDB.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {request.user_id} not found")

    # 4. Check if user already has an attendee (from create_meeting)
    existing = db.query(VideoSessionAttendeeDB).filter(
        VideoSessionAttendeeDB.video_session_id == video_session.id,
        VideoSessionAttendeeDB.participant_user_id == request.user_id,
    ).first()

    if existing and existing.attendee_id and existing.join_payload:
        # Return existing join payload
        join_token = existing.join_payload.get("join_token")
        attendee_id = existing.attendee_id
        if not join_token:
            join_token = existing.join_payload.get("attendee_id")  # fallback
        if not join_token:
            # Re-create attendee if payload missing
            pass  # fall through to create
        else:
            # Consultation: started when first person joins
            if consultation.started_at is None:
                consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
                consultation.started_at = now
            if existing.joined_at is None:
                existing.joined_at = now
            db.commit()

            meeting = get_meeting(meeting_id)
            media_placement = meeting.get("MediaPlacement")
            join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"
            return VideoSessionJoinResponse(
                meeting_id=meeting_id,
                attendee_id=attendee_id,
                join_token=join_token,
                media_placement=media_placement,
                join_url=join_url,
            )

    # 5. Create new attendee via Chime (user not in initial create_meeting list)
    response = create_attendee(
        meeting_id=meeting_id,
        external_user_id=str(request.user_id),
    )

    attendee = response["Attendee"]
    join_token = attendee["JoinToken"]
    attendee_id = attendee["AttendeeId"]

    # 6. Persist to video_session_attendees (backend owns state)
    vs_attendee = VideoSessionAttendeeDB(
        video_session_id=video_session.id,
        participant_user_id=request.user_id,
        participant_role=CONFIG_MEETING.ROLE.PARTICIPANT,
        attendee_id=attendee_id,
        join_payload={"join_token": join_token, "attendee_id": attendee_id},
        joined_at=now,
    )
    db.add(vs_attendee)

    # 7. Consultation: started when first person joins
    if consultation.started_at is None:
        consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.STARTED
        consultation.started_at = now

    db.commit()

    # 8. Get media placement for Chime SDK init
    meeting = get_meeting(meeting_id)
    media_placement = meeting.get("MediaPlacement")
    join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"

    return VideoSessionJoinResponse(
        meeting_id=meeting_id,
        attendee_id=attendee_id,
        join_token=join_token,
        media_placement=media_placement,
        join_url=join_url,
    )
