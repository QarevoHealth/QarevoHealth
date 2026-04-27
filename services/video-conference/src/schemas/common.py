"""Shared schema building blocks reused across doctor, patient, auth schemas."""

from enum import Enum

from pydantic import BaseModel, Field, model_validator


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
        if not self.terms_privacy:
            raise ValueError("Terms of Service and Privacy Policy must be accepted")
        if not self.telehealth:
            raise ValueError("Telehealth consent must be accepted")
        return self


class OptionalConsentsInput(BaseModel):
    """Consents for minimal signup — all optional, default False; can be completed later."""

    terms_privacy: bool = Field(False, description="Terms & privacy (optional at signup)")
    telehealth: bool = Field(False, description="Telehealth (optional at signup)")
    marketing: bool = Field(False, description="Marketing (optional)")
