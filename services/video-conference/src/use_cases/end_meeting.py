"""End meeting use case - Delete Chime meeting."""

from src.chime_client import delete_meeting
from src.models import EndMeetingResponse


def execute(meeting_id: str) -> EndMeetingResponse:
    """End/delete a Chime meeting."""
    delete_meeting(meeting_id=meeting_id)
    return EndMeetingResponse(meeting_id=meeting_id)
