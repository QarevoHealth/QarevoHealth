"""Join meeting use case - Create attendee and return join link."""

from src.chime_client import create_attendee
from src.models import JoinMeetingRequest, JoinMeetingResponse
from src.config import config


def execute(meeting_id: str, request: JoinMeetingRequest) -> JoinMeetingResponse:
    """Create attendee for meeting and return join link."""
    response = create_attendee(
        meeting_id=meeting_id,
        external_user_id=request.external_user_id,
    )
    
    attendee = response["Attendee"]
    join_token = attendee["JoinToken"]
    join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}"
    
    return JoinMeetingResponse(
        meeting_id=meeting_id,
        attendee_id=attendee["AttendeeId"],
        join_token=join_token,
        join_url=join_url,
    )
