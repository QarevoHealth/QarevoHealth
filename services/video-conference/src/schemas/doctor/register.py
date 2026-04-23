"""Doctor registration request/response schemas."""

import re
from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from src.schemas.common import ConsentsInput, Gender


class DoctorRegisterRequest(BaseModel):
    """Doctor registration request — creates a PROVIDER account."""

    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = Field(None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: str | None = Field(None, min_length=3, max_length=100, description="Optional unique username for doctor login (letters, numbers, dots, underscores, hyphens only)")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, max_length=128)
    phone: str = Field(..., min_length=1, max_length=20, description="Digits only")
    country_code: str = Field(..., min_length=1, max_length=5, description="e.g. +1")
    date_of_birth: date = Field(...)
    gender: str = Field(..., description="MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY")
    specialty: str | None = Field(None, description="e.g. CARDIOLOGY — must match DoctorSpecialty constants")
    experience_years: int | None = Field(None, ge=0, le=80, description="Years of experience (optional)")
    license_number: str | None = Field(None, max_length=100, description="Medical license number (optional)")
    is_independent: bool = Field(False, description="Independent practitioner?")
    address_line1: str | None = Field(None, max_length=255, description="Address line 1 (optional)")
    address_line2: str | None = Field(None, max_length=255, description="Address line 2 (optional)")
    address_city: str | None = Field(None, max_length=100, description="City (optional)")
    address_state: str | None = Field(None, max_length=100, description="State / Province (optional)")
    address_country: str | None = Field(None, max_length=100, description="Country (optional)")
    address_zip: str | None = Field(None, max_length=20, description="Zip / Postal code (optional)")
    consents: ConsentsInput = Field(..., description="Terms + Telehealth mandatory")

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        stripped = v.strip().lower()
        if not stripped:
            return None
        if not re.match(r"^[a-z0-9._-]+$", stripped):
            raise ValueError("Username may only contain letters, numbers, dots, underscores, and hyphens")
        return stripped

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

    @field_validator("specialty")
    @classmethod
    def specialty_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        from src.constants.provider import DoctorSpecialty
        normalized = v.strip().upper()
        allowed = {
            attr for attr in vars(DoctorSpecialty)
            if not attr.startswith("_") and isinstance(getattr(DoctorSpecialty, attr), str)
        }
        if normalized not in allowed:
            raise ValueError(
                f"Invalid specialty '{v}'. Must be one of: {', '.join(sorted(allowed))}"
            )
        return normalized

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
    message: str = Field("Doctor registration successful. Please verify your email.")
