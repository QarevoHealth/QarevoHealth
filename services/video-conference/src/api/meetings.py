from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.api.errors import handle_aws_error
from src.database import get_db
from src.models import CreateMeetingRequest, CreateMeetingResponse
from src.use_cases.create_meeting import execute as create_meeting

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])


@router.post("", response_model=CreateMeetingResponse, status_code=201)
def create_meeting_api(request: CreateMeetingRequest, db: Session = Depends(get_db)):
    """Schedule consultation - stores appointment/consultation only. Chime meeting created at join time."""
    try:
        return create_meeting(request, db)
    except HTTPException:
        raise
    except Exception as e:
        handle_aws_error(e)
