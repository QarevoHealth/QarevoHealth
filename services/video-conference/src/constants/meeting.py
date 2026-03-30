"""
Meeting-related constants.
Import as: from src.constants.meeting import CONFIG_MEETING
Usage: CONFIG_MEETING.APPOINTMENT_STATUS.BOOKED
"""


class CONFIG_MEETING:
    """Meeting/consultation/appointment status and role constants."""

    class APPOINTMENT_STATUS:
        BOOKED = "BOOKED"
        SCHEDULED = "SCHEDULED"
        COMPLETED = "COMPLETED"
        CANCELLED = "CANCELLED"

    class CONSULTATION_STATUS:
        SCHEDULED = "SCHEDULED"
        STARTED = "STARTED"
        ENDED = "ENDED"
        CANCELLED = "CANCELLED"


    class VIDEO_SESSION_STATUS:
        SCHEDULED = "SCHEDULED"
        ENDED = "ENDED"

    class ROLE:
        PATIENT = "PATIENT"
        PROVIDER = "PROVIDER"
        PARTICIPANT = "PARTICIPANT"
        PRIMARY = "PRIMARY"
