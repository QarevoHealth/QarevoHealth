"""Request/response schemas."""

from src.schemas.common import ConsentsInput, Gender
from src.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendPasswordResetRequest,
    ResendPasswordResetResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyEmailCodeRequest,
    VerifyEmailCodeResponse,
)
from src.schemas.doctor import DoctorRegisterRequest, DoctorRegisterResponse

__all__ = [
    "ConsentsInput",
    "Gender",
    "ForgotPasswordRequest",
    "ForgotPasswordResponse",
    "LoginRequest",
    "LoginResponse",
    "LogoutRequest",
    "LogoutResponse",
    "RefreshRequest",
    "RegisterRequest",
    "RegisterResponse",
    "ResendPasswordResetRequest",
    "ResendPasswordResetResponse",
    "ResendVerificationRequest",
    "ResendVerificationResponse",
    "ResetPasswordRequest",
    "ResetPasswordResponse",
    "VerifyEmailCodeRequest",
    "VerifyEmailCodeResponse",
    "DoctorRegisterRequest",
    "DoctorRegisterResponse",
]
