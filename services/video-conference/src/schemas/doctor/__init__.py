"""Doctor schemas."""

from src.schemas.doctor.login import DoctorLoginRequest, DoctorLoginResponse
from src.schemas.doctor.register import DoctorRegisterRequest, DoctorRegisterResponse

__all__ = [
    "DoctorLoginRequest",
    "DoctorLoginResponse",
    "DoctorRegisterRequest",
    "DoctorRegisterResponse",
]
