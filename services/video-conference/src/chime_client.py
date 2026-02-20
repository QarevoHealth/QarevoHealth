"""AWS Chime SDK client wrapper."""

import uuid
import boto3
from botocore.exceptions import ClientError
from src.config import config


def get_chime_client():
    """Get Chime SDK Meetings client."""
    client_kwargs = {
        "service_name": "chime-sdk-meetings",
        "region_name": config.AWS_CHIME_REGION,
    }
    if config.AWS_ACCESS_KEY_ID and config.AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = config.AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = config.AWS_SECRET_ACCESS_KEY
    return boto3.client(**client_kwargs)


def create_meeting_with_attendees(
    external_meeting_id: str,
    attendees: list[dict],
    media_region: str | None = None,
) -> dict:
    """
    Create a Chime meeting with attendees.
    
    Args:
        external_meeting_id: External ID for the meeting
        attendees: List of {"external_user_id": str, "role": str}
        media_region: AWS region for meeting (default from config)
    
    Returns:
        Chime API response with Meeting and Attendees
    """
    client = get_chime_client()
    region = media_region or config.AWS_CHIME_REGION
    
    chime_attendees = [
        {
            "ExternalUserId": str(a["external_user_id"]),
            "Capabilities": {
                "Audio": "SendReceive",
                "Video": "SendReceive",
                "Content": "SendReceive",
            },
        }
        for a in attendees
    ]
    
    response = client.create_meeting_with_attendees(
        ClientRequestToken=str(uuid.uuid4()),
        MediaRegion=region,
        ExternalMeetingId=external_meeting_id,
        Attendees=chime_attendees,
    )
    
    return response


def create_attendee(meeting_id: str, external_user_id: str) -> dict:
    """
    Create an attendee for an existing meeting (for join link).
    
    Returns:
        Chime API response with Attendee (AttendeeId, JoinToken)
    """
    client = get_chime_client()
    response = client.create_attendee(
        MeetingId=meeting_id,
        ExternalUserId=str(external_user_id),
        Capabilities={
            "Audio": "SendReceive",
            "Video": "SendReceive",
            "Content": "SendReceive",
        },
    )
    return response


def delete_meeting(meeting_id: str) -> None:
    """End/delete a Chime meeting."""
    client = get_chime_client()
    client.delete_meeting(MeetingId=meeting_id)


def get_meeting(meeting_id: str) -> dict:
    """Get meeting details (MediaPlacement) for frontend to join."""
    client = get_chime_client()
    response = client.get_meeting(MeetingId=meeting_id)
    return response["Meeting"]
