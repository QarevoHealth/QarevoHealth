"""Doctor 2FA schemas."""

from pydantic import BaseModel, Field, field_validator


class Doctor2FAEmailSendResponse(BaseModel):
    """Response after sending doctor login 2FA email OTP."""

    message: str = Field("Email OTP sent.", description="Status message")


class Doctor2FAEmailVerifyRequest(BaseModel):
    """Request payload to verify doctor login 2FA email OTP."""

    code: str = Field(..., min_length=6, max_length=6, description="6-digit email OTP")

    @field_validator("code")
    @classmethod
    def code_digits_only(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Verification code must be 6 digits")
        return v


class Doctor2FAEmailVerifyResponse(BaseModel):
    """Response after verifying doctor login 2FA email OTP."""

    message: str = Field("Email OTP verified.", description="Status message")
    email_otp_verified: bool = Field(..., description="Email OTP verification status in current login 2FA session")
    phone_otp_verified: bool = Field(..., description="Phone OTP verification status in current login 2FA session")
