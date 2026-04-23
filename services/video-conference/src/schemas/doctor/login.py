"""Doctor login request/response schemas."""

import re

from pydantic import BaseModel, Field, field_validator


class DoctorLoginRequest(BaseModel):
    """Doctor login request — identifier + password."""

    identifier: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Doctor username, email, or phone with country code (e.g. +14155551234)",
    )
    password: str = Field(..., description="Password")

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Identifier cannot be empty")

        normalized = v.strip()
        if "@" in normalized:
            return normalized.lower()

        compact = re.sub(r"[\s\-()]", "", normalized)
        if compact.startswith("+") and compact[1:].isdigit():
            return compact

        return normalized.lower()


class DoctorLoginResponse(BaseModel):
    """Doctor login response with tokens."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token (store securely)")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiry in seconds")
