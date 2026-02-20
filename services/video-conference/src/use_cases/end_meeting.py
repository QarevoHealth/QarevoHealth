"""End meeting use case - Delete Chime meeting and update DB."""

from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.chime_client import delete_meeting
from src.models import EndMeetingResponse
from src.models import VideoSessionDB, ConsultationDB


def execute(meeting_id: str, db: Session) -> EndMeetingResponse:
    """End/delete a Chime meeting. Updates video_session and consultation status."""
    delete_meeting(meeting_id=meeting_id)

    # Find video session and update status
    video_session = db.query(VideoSessionDB).filter(
        VideoSessionDB.meeting_id == meeting_id
    ).first()
    if video_session:
        video_session.status = "ended"
        # Update consultation status
        consultation = db.query(ConsultationDB).filter(
            ConsultationDB.id == video_session.consultation_id
        ).first()
        if consultation:
            consultation.status = "ended"

    db.commit()

    return EndMeetingResponse(meeting_id=meeting_id)
