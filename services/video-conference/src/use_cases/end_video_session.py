"""End video session use case - Delete Chime meeting and update DB."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.chime_client import delete_meeting
from src.models import VideoSessionDB, ConsultationDB, AppointmentDB, VideoSessionEndResponse
from src.constants.meeting import CONFIG_MEETING


def execute(consultation_id: UUID, db: Session) -> VideoSessionEndResponse:
    """
    End/delete a Chime meeting for this consultation.
    Updates: video_session, consultation, and linked appointment(s).

    Data model: 1 consultation : 1 appointment (via consultation_id).
    The appointment linked to this consultation is the one we update.
    """
    now = datetime.now(timezone.utc)

    # 1. Load consultation
    consultation = (
        db.query(ConsultationDB).filter(ConsultationDB.id == consultation_id).first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # 2. Get video session to obtain Chime meeting_id (required for delete_meeting)
    video_session = (
        db.query(VideoSessionDB)
        .filter(VideoSessionDB.consultation_id == consultation_id)
        .first()
    )
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    meeting_id = video_session.meeting_id
    if not meeting_id:
        raise HTTPException(
            status_code=400,
            detail="Video session has no Chime meeting (cannot delete)",
        )

    # 3. Delete Chime meeting (requires meeting_id, not consultation_id)
    delete_meeting(meeting_id=meeting_id)

    # 4. Update video session
    video_session.status = CONFIG_MEETING.VIDEO_SESSION_STATUS.ENDED
    video_session.ended_at = now

    # 5. Update consultation
    consultation.status = CONFIG_MEETING.CONSULTATION_STATUS.ENDED
    consultation.ended_at = now

    # 6. Update appointment(s) linked to this consultation
    # Schema: 1 consultation : 1 appointment (appointment.consultation_id unique)
    appointments = (
        db.query(AppointmentDB)
        .filter(AppointmentDB.consultation_id == consultation_id)
        .all()
    )
    for appointment in appointments:
        appointment.status = CONFIG_MEETING.APPOINTMENT_STATUS.COMPLETED

    db.commit()

    return VideoSessionEndResponse(consultation_id=consultation_id)
