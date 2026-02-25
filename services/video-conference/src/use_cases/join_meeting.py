"""Join meeting use case - Create attendee and return join link."""

from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.chime_client import create_attendee
from src.models import JoinMeetingRequest, JoinMeetingResponse
from src.config import config
from src.models import VideoSessionDB, VideoSessionAttendeeDB, UserDB
from src.constants.meeting import CONFIG_MEETING


def execute(meeting_id: str, request: JoinMeetingRequest, db: Session) -> JoinMeetingResponse:
    """Create attendee for meeting and return join link. Uses video_sessions."""
    # Find video session by meeting_id
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.meeting_id == meeting_id
    ).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # external_user_id should be user UUID (string)
    try:
        user_id = UUID(request.external_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="external_user_id must be a valid user UUID")

    # Validate user exists
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    response = create_attendee(
        meeting_id=meeting_id,
        external_user_id=request.external_user_id,
    )

    attendee = response["Attendee"]
    join_token = attendee["JoinToken"]
    attendee_id = attendee["AttendeeId"]
    join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"

    # Save to video_session_attendees
    vs_attendee = VideoSessionAttendeeDB(
        video_session_id=video_session.id,
        participant_user_id=user_id,
        participant_role=CONFIG_MEETING.ROLE.PARTICIPANT,
        attendee_id=attendee_id,
        join_payload={"join_token": join_token, "attendee_id": attendee_id},
    )
    db.add(vs_attendee)
    db.commit()

    return JoinMeetingResponse(
        meeting_id=meeting_id,
        attendee_id=attendee_id,
        join_token=join_token,
        join_url=join_url,
    )
