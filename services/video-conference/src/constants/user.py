"""
User/auth constants - roles, status.
Import as: from src.constants.user import CONFIG_USER
"""


class CONFIG_USER:
    """User role and status constants."""

    class ROLE:
        PATIENT = "PATIENT"
        PROVIDER = "PROVIDER"

    class STATUS:
        PENDING_VERIFICATION = "PENDING_VERIFICATION"
        ACTIVE = "ACTIVE"
        SUSPENDED = "SUSPENDED"
        DEACTIVATED = "DEACTIVATED"
