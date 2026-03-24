"""Auth request/response schemas with validation."""

import re
from datetime import date
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class Gender(str, Enum):
    """Gender enum - uppercase values."""

    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class ConsentsInput(BaseModel):
    """Consents: terms_privacy, telehealth mandatory; marketing optional (default False)."""

    terms_privacy: bool = Field(..., description="Terms of Service & Privacy Policy - mandatory, must be True")
    telehealth: bool = Field(..., description="Telehealth consent - mandatory, must be True")
    marketing: bool = Field(False, description="Marketing communications - optional, default False")

    @model_validator(mode="after")
    def validate_mandatory_consents(self):
        """Terms_privacy and telehealth must both be True."""
        if not self.terms_privacy:
            raise ValueError("Terms of Service and Privacy Policy must be accepted")
        if not self.telehealth:
            raise ValueError("Telehealth consent must be accepted")
        return self


class RegisterRequest(BaseModel):
    """Registration request with validation."""

    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    phone: str = Field(..., min_length=1, max_length=20, description="Phone number")
    country_code: str = Field(..., min_length=1, max_length=5, description="Country code (e.g. +49)")
    date_of_birth: date = Field(..., description="Date of birth")
    gender: str = Field(..., description="Gender: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
    consents: ConsentsInput = Field(..., description="Consent flags (terms_privacy, telehealth mandatory)")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Gender cannot be empty")
        allowed = {g.value for g in Gender}
        if v.strip().upper() not in allowed:
            raise ValueError("Gender must be one of: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
        return v.strip().upper()

    @field_validator("country_code")
    @classmethod
    def country_code_valid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Country code cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        """Normalize email to lowercase for consistent storage and duplicate checks."""
        return v.lower().strip() if v else v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Password: 8-128 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char."""
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
    """Response after successful registration."""

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


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str = Field(..., description="Refresh token")


class LogoutRequest(BaseModel):
    """Logout request - revoke refresh token."""

    refresh_token: str = Field(..., description="Refresh token to revoke")


class LogoutResponse(BaseModel):
    """Response after logout."""

    message: str = Field("Logged out successfully.", description="Status message")


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
