"""Database models - one file per model."""

from src.models.appointment import AppointmentDB
from src.models.appointment_provider import AppointmentProviderDB
from src.models.consultation import ConsultationDB
from src.models.consultation_provider import ConsultationProviderDB
from src.models.patient import PatientDB
from src.models.provider import ProviderDB
from src.models.tenant import TenantDB
from src.models.user import UserDB
from src.models.video_session import VideoSessionDB
from src.models.video_session_artifact import VideoSessionArtifactDB
from src.models.video_session_attendee import VideoSessionAttendeeDB

__all__ = [
    "AppointmentDB",
    "AppointmentProviderDB",
    "AttendeeDB",
    "ConsultationDB",
    "ConsultationProviderDB",
    "MeetingDB",
    "PatientDB",
    "ProviderDB",
    "TenantDB",
    "UserDB",
    "VideoSessionDB",
    "VideoSessionArtifactDB",
    "VideoSessionAttendeeDB",
]
