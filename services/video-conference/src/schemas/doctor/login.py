"""Doctor login request/response schemas."""

from pydantic import BaseModel, Field, field_validator


class DoctorLoginRequest(BaseModel):
    """Doctor login request — username + password only."""

    username: str = Field(..., min_length=1, max_length=100, description="Doctor username")
    password: str = Field(..., description="Password")

    @field_validator("username")
    @classmethod
    def username_lowercase(cls, v: str) -> str:
        return v.strip().lower() if v else v


class DoctorLoginResponse(BaseModel):
    """Doctor login response with tokens."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token (store securely)")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiry in seconds")
