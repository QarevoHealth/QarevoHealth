"""Create meeting use case - AWS Chime SDK."""

from src.chime_client import create_meeting_with_attendees
from src.models import CreateMeetingRequest, CreateMeetingResponse, AttendeeJoinInfo
from src.config import config


def execute(request: CreateMeetingRequest) -> CreateMeetingResponse:
    """Create a Chime meeting with participants."""
    external_meeting_id = f"meeting-{request.attendees[0].external_user_id}"
    
    attendees_payload = [
        {"external_user_id": a.external_user_id, "role": a.role}
        for a in request.attendees
    ]
    
    response = create_meeting_with_attendees(
        external_meeting_id=external_meeting_id,
        attendees=attendees_payload,
    )
    
    meeting = response["Meeting"]
    meeting_id = meeting["MeetingId"]
    media_region = meeting["MediaRegion"]
    
    attendee_infos = []
    for att in response.get("Attendees", []):
        join_token = att["JoinToken"]
        external_user_id = att["ExternalUserId"]
        join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}"
        
        attendee_infos.append(
            AttendeeJoinInfo(
                external_user_id=external_user_id,
                attendee_id=att["AttendeeId"],
                join_token=join_token,
                join_url=join_url,
            )
        )
    
    return CreateMeetingResponse(
        meeting_id=meeting_id,
        external_meeting_id=meeting["ExternalMeetingId"],
        media_region=media_region,
        attendees=attendee_infos,
    )
