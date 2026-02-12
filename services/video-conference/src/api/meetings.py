"""API routes for meetings."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.models import CreateMeetingRequest, CreateMeetingResponse, ParticipantResponse
from src.use_cases.create_meeting import CreateMeetingUseCase
from src.database import get_db

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])


@router.post("", response_model=CreateMeetingResponse, status_code=201)
def create_meeting(
    request: CreateMeetingRequest,
    db: Session = Depends(get_db)
):
    """Create a meeting with host and attendee."""
    try:
        use_case = CreateMeetingUseCase(db)
        session = use_case.execute(
            host_id=request.host_id,
            attendee_id=request.attendee_id
        )
        
        return CreateMeetingResponse(
            session_id=session.id,
            host_id=session.host_id,
            participants=[
                ParticipantResponse(user_id=p.user_id, role=p.role)
                for p in session.participants
            ],
            status=session.status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
