from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
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
from src.chime_client import get_meeting
from src.database import get_db
from src.models import VideoSessionDB, VideoSessionAttendeeDB

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
def create_meeting_api(request: CreateMeetingRequest, db: Session = Depends(get_db)):
    """Create a Chime meeting with participants. Stores consultation, patient, provider in DB."""
    try:
        return create_meeting(request, db)
    except HTTPException:
        raise
    except Exception as e:
        _handle_aws_error(e)


@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse, status_code=201)
def join_meeting_api(meeting_id: str, request: JoinMeetingRequest, db: Session = Depends(get_db)):
    """Get a join link for an existing meeting. Creates a new attendee and returns join URL."""
    try:
        return join_meeting(meeting_id, request, db)
    except HTTPException:
        raise
    except Exception as e:
        _handle_aws_error(e)


@router.delete("/{meeting_id}", response_model=EndMeetingResponse)
def end_meeting_api(meeting_id: str, db: Session = Depends(get_db)):
    """End/delete a Chime meeting. All attendees will be disconnected."""
    try:
        return end_meeting(meeting_id, db)
    except Exception as e:
        _handle_aws_error(e)


@router.get("/{meeting_id}")
def get_meeting_api(meeting_id: str):
    """Get meeting details (MediaPlacement) for frontend to join."""
    try:
        meeting = get_meeting(meeting_id)
        return {
            "meeting_id": meeting["MeetingId"],
            "media_placement": meeting["MediaPlacement"],
        }
    except Exception as e:
        _handle_aws_error(e)


@router.post("/{meeting_id}/attendees/{attendee_id}/joined")
def attendee_joined_api(meeting_id: str, attendee_id: str, db: Session = Depends(get_db)):
    """Frontend calls this when user successfully joins. Track who joined in DB."""
    from datetime import datetime, timezone
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.meeting_id == meeting_id
    ).first()
    if video_session:
        attendee = db.query(VideoSessionAttendeeDB).filter(
            VideoSessionAttendeeDB.video_session_id == video_session.id,
            VideoSessionAttendeeDB.attendee_id == attendee_id
        ).first()
        if attendee:
            attendee.joined_at = datetime.now(timezone.utc)
            db.commit()
    return {"status": "joined", "meeting_id": meeting_id, "attendee_id": attendee_id}


@router.get("/{meeting_id}/attendees/joined")
def get_joined_attendees_api(meeting_id: str, db: Session = Depends(get_db)):
    """Get list of attendees who have joined (from DB)."""
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.meeting_id == meeting_id
    ).first()
    if not video_session:
        return {"meeting_id": meeting_id, "joined_attendees": [], "joined_details": []}
    joined = db.query(VideoSessionAttendeeDB).filter(
        VideoSessionAttendeeDB.video_session_id == video_session.id,
        VideoSessionAttendeeDB.joined_at.isnot(None)
    ).all()
    return {
        "meeting_id": meeting_id,
        "joined_attendees": [a.attendee_id for a in joined if a.attendee_id],
        "joined_details": [
            {"attendee_id": a.attendee_id, "participant_user_id": str(a.participant_user_id), "joined_at": str(a.joined_at)}
            for a in joined
        ]
    }
