"""Auth request/response schemas — shared for all roles: login, logout, refresh, verify, reset, patient register."""

import re
from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from src.schemas.common import ConsentsInput, Gender


class RegisterRequest(BaseModel):
    """Patient registration request with validation."""

    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    middle_name: str | None = Field(None, max_length=100, description="Middle name (optional)")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    phone: str = Field(..., min_length=1, max_length=20, description="Phone number")
    country_code: str = Field(..., min_length=1, max_length=5, description="Country code (e.g. +49)")
    date_of_birth: date = Field(..., description="Date of birth")
    gender: str = Field(..., description="Gender: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
    consents: ConsentsInput = Field(..., description="Consent flags (terms_privacy, telehealth mandatory)")

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("middle_name")
    @classmethod
    def middle_name_strip(cls, v: str | None) -> str | None:
        return v.strip() if v and v.strip() else None

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Gender cannot be empty")
        allowed = {g.value for g in Gender}
        if v.strip().upper() not in allowed:
            raise ValueError("Gender must be one of: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
        return v.strip().upper()

    @field_validator("phone")
    @classmethod
    def phone_numeric(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Phone number cannot be empty")
        if not stripped.isdigit():
            raise ValueError("Phone number must contain digits only")
        return stripped

    @field_validator("country_code")
    @classmethod
    def country_code_valid(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Country code cannot be empty")
        digits = stripped.lstrip("+")
        if not digits.isdigit():
            raise ValueError("Country code must be + followed by digits (e.g. +1, +49)")
        return stripped

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8 or len(v) > 128:
            raise ValueError("Password must be 8-128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class RegisterResponse(BaseModel):
    """Response after successful patient registration."""

    user_id: UUID = Field(..., description="Created user UUID")
    message: str = Field("Registration successful.", description="Status message")


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v


class LoginResponse(BaseModel):
    """Login response with tokens."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token (store securely)")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiry in seconds")
    email_verified: bool = Field(..., description="Whether email is verified")
    phone_verified: bool = Field(..., description="Whether phone is verified")


class DoctorLoginRequest(BaseModel):
    """Doctor login request: identifier can be email, username, or phone."""

    identifier: str = Field(..., min_length=1, max_length=255, description="Email, username, or phone number")
    password: str = Field(..., description="Password")

    @field_validator("identifier")
    @classmethod
    def identifier_normalize(cls, v: str) -> str:
        return v.strip()


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str = Field(..., description="Refresh token")


class LogoutRequest(BaseModel):
    """Logout request - revoke refresh token."""

    refresh_token: str = Field(..., description="Refresh token to revoke")


class LogoutResponse(BaseModel):
    """Response after logout."""

    message: str = Field("Logged out successfully.", description="Status message")


class DoctorRegisterRequest(BaseModel):
    """Doctor registration request — creates a PROVIDER account."""

    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = Field(None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128)
    phone: str = Field(..., min_length=1, max_length=20, description="Digits only")
    country_code: str = Field(..., min_length=1, max_length=5, description="e.g. +1")
    date_of_birth: date = Field(...)
    gender: str = Field(..., description="MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
    specialty: str | None = Field(None, max_length=200, description="Medical specialty (optional at registration)")
    experience_years: int | None = Field(None, ge=0, le=80, description="Years of experience (optional)")
    license_number: str | None = Field(None, max_length=100, description="Medical license number (optional at registration)")
    is_independent: bool = Field(False, description="Independent practitioner?")
    consents: ConsentsInput = Field(..., description="Terms + Telehealth mandatory")

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("middle_name")
    @classmethod
    def middle_name_strip(cls, v: str | None) -> str | None:
        return v.strip() if v and v.strip() else None

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        allowed = {g.value for g in Gender}
        if v.strip().upper() not in allowed:
            raise ValueError("Gender must be one of: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
        return v.strip().upper()

    @field_validator("phone")
    @classmethod
    def phone_numeric(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped.isdigit():
            raise ValueError("Phone number must contain digits only")
        return stripped

    @field_validator("country_code")
    @classmethod
    def country_code_valid(cls, v: str) -> str:
        stripped = v.strip()
        digits = stripped.lstrip("+")
        if not digits.isdigit():
            raise ValueError("Country code must be + followed by digits (e.g. +1, +49)")
        return stripped

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8 or len(v) > 128:
            raise ValueError("Password must be 8-128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class DoctorRegisterResponse(BaseModel):
    """Response after successful doctor registration."""

    user_id: UUID = Field(..., description="Created user UUID")
    provider_id: UUID = Field(..., description="Created provider profile UUID")
    message: str = Field("Doctor registration successful. Please verify your email.", description="Status message")


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email."""

    email: EmailStr = Field(..., description="Email address of registered user")

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v


class ResendVerificationResponse(BaseModel):
    """Response after resending verification email."""

    message: str = Field("Verification email sent.", description="Status message")


class ResendPhoneVerificationRequest(BaseModel):
    """Request to resend phone verification OTP to the registered phone."""

    country_code: str = Field(..., min_length=1, max_length=5, description="Country code (e.g. +1, +91)")
    phone: str = Field(..., min_length=1, max_length=20, description="Phone number (digits only)")

    @field_validator("country_code")
    @classmethod
    def country_code_valid(cls, v: str) -> str:
        stripped = v.strip()
        digits = stripped.lstrip("+")
        if not digits.isdigit():
            raise ValueError("Country code must be + followed by digits (e.g. +1, +49)")
        return stripped

    @field_validator("phone")
    @classmethod
    def phone_digits_only(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped.isdigit():
            raise ValueError("Phone number must contain digits only")
        return stripped


class ForgotPasswordRequest(BaseModel):
    """Request to send password reset email."""

    email: EmailStr = Field(..., description="Email address of the account")

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v


class ForgotPasswordResponse(BaseModel):
    """Response after requesting password reset (always 200 for security)."""

    message: str = Field(
        "If an account exists with this email, a password reset link has been sent.",
        description="Status message",
    )


class ResetPasswordRequest(BaseModel):
    """Request to reset password with token from email link."""

    token: str = Field(..., min_length=1, description="Reset token from email link")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8 or len(v) > 128:
            raise ValueError("Password must be 8-128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class ResetPasswordResponse(BaseModel):
    """Response after successful password reset."""

    message: str = Field("Password has been reset successfully.", description="Status message")


class ResendPasswordResetRequest(BaseModel):
    """Request to resend password reset email."""

    email: EmailStr = Field(..., description="Email address of the account")

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v


class ResendPasswordResetResponse(BaseModel):
    """Response after resending password reset email."""

    message: str = Field("Password reset email sent.", description="Status message")


class VerifyEmailCodeRequest(BaseModel):
    """Request to verify email using a 6-digit OTP code."""

    email: EmailStr = Field(..., description="Registered email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower().strip() if v else v

    @field_validator("code")
    @classmethod
    def code_digits_only(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Verification code must be 6 digits")
        return v


class VerifyEmailCodeResponse(BaseModel):
    """Response after successful OTP email verification."""

    message: str = Field("Email verified successfully.", description="Status message")


class VerifyPhoneCodeRequest(BaseModel):
    """Provider: verify phone with 6-digit SMS OTP (after email is verified)."""

    country_code: str = Field(..., min_length=1, max_length=5, description="Country code (e.g. +1, +91)")
    phone: str = Field(..., min_length=1, max_length=20, description="Phone number (digits only)")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit SMS code")

    @field_validator("country_code")
    @classmethod
    def country_code_valid_phone(cls, v: str) -> str:
        stripped = v.strip()
        digits = stripped.lstrip("+")
        if not digits.isdigit():
            raise ValueError("Country code must be + followed by digits (e.g. +1, +49)")
        return stripped

    @field_validator("phone")
    @classmethod
    def phone_digits_only_verify(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped.isdigit():
            raise ValueError("Phone number must contain digits only")
        return stripped

    @field_validator("code")
    @classmethod
    def code_digits_only_phone(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Verification code must be 6 digits")
        return v


class VerifyPhoneCodeResponse(BaseModel):
    message: str = Field("Phone verified successfully.", description="Status message")
