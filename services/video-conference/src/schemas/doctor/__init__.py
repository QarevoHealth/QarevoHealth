"""Doctor schemas."""

from src.schemas.doctor.login import DoctorLoginRequest, DoctorLoginResponse
from src.schemas.doctor.register import DoctorRegisterRequest, DoctorRegisterResponse
from src.schemas.doctor.two_factor import (
    Doctor2FAEmailSendResponse,
    Doctor2FAEmailVerifyRequest,
    Doctor2FAEmailVerifyResponse,
)

__all__ = [
    "DoctorLoginRequest",
    "DoctorLoginResponse",
    "Doctor2FAEmailSendResponse",
    "Doctor2FAEmailVerifyRequest",
    "Doctor2FAEmailVerifyResponse",
    "DoctorRegisterRequest",
    "DoctorRegisterResponse",
]
