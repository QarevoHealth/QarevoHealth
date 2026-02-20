"""Create meeting use case - AWS Chime SDK + DB (consultation, appointment, video_session, etc)."""

from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.chime_client import create_meeting_with_attendees
from src.models import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    AttendeeJoinInfo,
    AppointmentDB,
    AppointmentProviderDB,
    ConsultationDB,
    ConsultationProviderDB,
    VideoSessionDB,
    VideoSessionAttendeeDB,
    PatientDB,
    ProviderDB,
)
from src.config import config


def execute(request: CreateMeetingRequest, db: Session) -> CreateMeetingResponse:
    """Create a Chime meeting and store consultation, appointment, providers in DB."""
    # 1. Validate patient exists
    patient = db.query(PatientDB).filter(PatientDB.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {request.patient_id} not found")

    # 2. Validate all providers exist and collect user_ids
    providers = db.query(ProviderDB).filter(ProviderDB.id.in_(request.provider_ids)).all()
    if len(providers) != len(request.provider_ids):
        found_ids = {p.id for p in providers}
        missing = set(request.provider_ids) - found_ids
        raise HTTPException(status_code=404, detail=f"Providers not found: {missing}")

    # 3. Build attendees list: patient + providers (Chime needs external_user_id = str)
    patient_user_id = patient.user_id
    attendees_payload = [
        {"external_user_id": str(patient_user_id), "role": "patient"},
    ]
    for p in providers:
        attendees_payload.append({"external_user_id": str(p.user_id), "role": "provider"})

    # 4. Create consultation first (needed for external_meeting_id - Chime max 64 chars)
    consultation = ConsultationDB(
        patient_id=request.patient_id,
        status="SCHEDULED",
        scheduled_at=request.scheduled_at,
        created_by_user_id=patient_user_id,
    )
    db.add(consultation)
    db.flush()
    external_meeting_id = str(consultation.id)  # UUID = 36 chars, under Chime's 64 limit

    # 5. Create Chime meeting
    response = create_meeting_with_attendees(
        external_meeting_id=external_meeting_id,
        attendees=attendees_payload,
    )

    meeting = response["Meeting"]
    meeting_id = meeting["MeetingId"]
    media_region = meeting["MediaRegion"]

    # 6. Appointment: link existing OR create new + appointment_providers
    if request.appointment_id:
        # Link to existing appointment
        appointment = db.query(AppointmentDB).filter(
            AppointmentDB.id == request.appointment_id,
            AppointmentDB.patient_id == request.patient_id,
        ).first()
        if not appointment:
            raise HTTPException(
                status_code=404,
                detail=f"Appointment {request.appointment_id} not found or does not belong to patient",
            )
        appointment.consultation_id = consultation.id
        appointment.status = "SCHEDULED"  # scheduled when creating; IN_PROGRESS when call actually starts
        appointment.created_by_user_id = patient_user_id
        # appointment_providers already exist from when appointment was created
    else:
        # Create new appointment + appointment_providers
        start_at = request.start_at or request.scheduled_at
        if not start_at:
            raise HTTPException(
                status_code=400,
                detail="start_at or scheduled_at required when creating meeting without appointment_id",
            )
        end_at = request.end_at or (start_at + timedelta(minutes=60))
        appointment = AppointmentDB(
            patient_id=request.patient_id,
            start_at=start_at,
            end_at=end_at,
            consultation_id=consultation.id,
            status="SCHEDULED",
            created_by_user_id=patient_user_id,
        )
        db.add(appointment)
        db.flush()
        for provider in providers:
            ap = AppointmentProviderDB(
                appointment_id=appointment.id,
                provider_id=provider.id,
                role="PRIMARY",
            )
            db.add(ap)

    # 7. Link providers to consultation
    for provider in providers:
        cp = ConsultationProviderDB(
            consultation_id=consultation.id,
            provider_id=provider.id,
            role="PRIMARY",
        )
        db.add(cp)

    # 8. Create video session (links consultation to Chime meeting)
    video_session = VideoSessionDB(
        consultation_id=consultation.id,
        meeting_id=meeting_id,
        status="SCHEDULED",
    )
    db.add(video_session)
    db.flush()

    # 9. Map external_user_id (str(user_id)) -> (user_id, role)
    ext_to_user = {str(patient_user_id): (patient_user_id, "patient")}
    for p in providers:
        ext_to_user[str(p.user_id)] = (p.user_id, "provider")

    # 10. Create video_session_attendees and build response
    attendee_infos = []
    chime_attendees = response.get("Attendees", [])

    for att in chime_attendees:
        ext_uid = att["ExternalUserId"]
        user_id, role = ext_to_user.get(ext_uid, (None, "participant"))
        if user_id is None:
            continue  # Skip if not in our map
        join_token = att["JoinToken"]
        attendee_id = att["AttendeeId"]
        join_url = f"{config.APP_JOIN_URL}?meetingId={meeting_id}&joinToken={join_token}&attendeeId={attendee_id}"

        vs_attendee = VideoSessionAttendeeDB(
            video_session_id=video_session.id,
            participant_user_id=user_id,
            participant_role=role,
            attendee_id=attendee_id,
            join_payload={"join_token": join_token, "attendee_id": attendee_id},
        )
        db.add(vs_attendee)

        attendee_infos.append(
            AttendeeJoinInfo(
                user_id=user_id,
                participant_role=role,
                attendee_id=attendee_id,
                join_token=join_token,
                join_url=join_url,
            )
        )

    db.commit()

    return CreateMeetingResponse(
        consultation_id=consultation.id,
        meeting_id=meeting_id,
        external_meeting_id=meeting.get("ExternalMeetingId", external_meeting_id),
        media_region=media_region,
        attendees=attendee_infos,
    )
