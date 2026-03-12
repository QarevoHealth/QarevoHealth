"""API routes for Chime meetings."""

from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError
from src.models import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    JoinMeetingRequest,
    JoinMeetingResponse,
    EndMeetingResponse,
)
from src.use_cases.create_meeting import execute as create_meeting
from src.use_cases.join_meeting import execute as join_meeting
from src.use_cases.end_meeting import execute as end_meeting

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])


def _handle_aws_error(e: Exception) -> None:
    """Convert AWS errors to HTTP exceptions."""
    if isinstance(e, ClientError):
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "NotFoundException":
            raise HTTPException(status_code=404, detail="Meeting not found")
        if error_code == "BadRequestException":
            raise HTTPException(status_code=400, detail=str(e))
    raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=CreateMeetingResponse, status_code=201)
def create_meeting_api(request: CreateMeetingRequest):
    """Create a Chime meeting with participants. Returns join links for each attendee."""
    try:
        return create_meeting(request)
    except Exception as e:
        _handle_aws_error(e)


@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse, status_code=201)
def join_meeting_api(meeting_id: str, request: JoinMeetingRequest):
    """Get a join link for an existing meeting. Creates a new attendee and returns join URL."""
    try:
        return join_meeting(meeting_id, request)
    except Exception as e:
        _handle_aws_error(e)


@router.delete("/{meeting_id}", response_model=EndMeetingResponse)
def end_meeting_api(meeting_id: str):
    """End/delete a Chime meeting. All attendees will be disconnected."""
    try:
        return end_meeting(meeting_id)
    except Exception as e:
        _handle_aws_error(e)
