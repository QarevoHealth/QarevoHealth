"""Join meeting use case - Create attendee and return join link."""

from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from src.chime_client import create_attendee
from src.models import JoinMeetingRequest, JoinMeetingResponse
from src.models import VideoSessionDB, VideoSessionAttendeeDB, UserDB, ConsultationDB, ConsultationProviderDB
from src.constants.meeting import CONFIG_MEETING
from src.utils import build_join_url, get_join_role


def execute(meeting_id: str, request: JoinMeetingRequest, db: Session) -> JoinMeetingResponse:
    """Create attendee for meeting and return join link. Uses video_sessions."""
    video_session = (
        db.query(VideoSessionDB)
        .options(
            joinedload(VideoSessionDB.consultation).joinedload(ConsultationDB.patient),
            joinedload(VideoSessionDB.consultation).joinedload(ConsultationDB.consultation_providers).joinedload(ConsultationProviderDB.provider),
        )
        .filter(VideoSessionDB.meeting_id == meeting_id)
        .first()
    )
    if not video_session:
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        user_id = UUID(request.external_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="external_user_id must be a valid user UUID")

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
    join_url = build_join_url(meeting_id, join_token, attendee_id)

    consultation = video_session.consultation
    role = get_join_role(consultation, user_id) if consultation else CONFIG_MEETING.ROLE.PROVIDER

    vs_attendee = VideoSessionAttendeeDB(
        video_session_id=video_session.id,
        participant_user_id=user_id,
        participant_role=role,
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
