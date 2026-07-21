from pydantic import BaseModel, Field, UUID4, field_validator
from typing import Dict, Any

class AIDraftRequest(BaseModel):
    # Audit & Tracking Requirements
    correlation_id: UUID4 = Field(
        ..., 
        description="Unique identifier to track this request across microservices."
    )
    
    # Safety Policy Gate Inputs
    patient_consent_verified: bool = Field(
        ..., 
        description="Must be True to permit processing. Simulates the policy gate constraint."
    )
    is_clinical_automation: bool = Field(
        False, 
        description="Explicitly tracks if the request attempts prohibited autonomous clinical triage."
    )
    
    # Placeholders for BE-006 Verified Fields & Doctor Notes
    # Once those components are developed, replace Dict[str, Any] with the actual Pydantic models.
    verified_input_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Placeholder for BE-006 verified fields and doctor notes layout."
    )

    @field_validator("patient_consent_verified")
    @classmethod
    def enforce_consent_gate(cls, v: bool) -> bool:
        if not v:
            raise ValueError("AI processing blocked: Patient consent has not been verified.")
        return v

    @field_validator("is_clinical_automation")
    @classmethod
    def block_clinical_automation(cls, v: bool) -> bool:
        if v:
            raise ValueError("AI processing blocked: Autonomous clinical triage or decision-making is prohibited.")
        return v


class AIDraftResponse(BaseModel):
    correlation_id: UUID4
    status: str = "success"
    
    # Placeholder for the final generated Doctor Note shape
    drafted_note: Dict[str, Any] = Field(
        ..., 
        description="Deterministic output structured to match the future Doctor Notes Schema."
    )