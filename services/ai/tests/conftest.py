import pytest
import uuid
from typing import Dict, Any

@pytest.fixture
def valid_synthetic_request_payload() -> Dict[str, Any]:
    """
    Returns a valid dictionary payload conforming to the synthetic fixture shape.
    Used to test normal operational pathways.
    """
    return {
        "correlation_id": str(uuid.uuid4()),
        "patient_consent_verified": True,
        "is_clinical_automation": False,
        "verified_input_data": {
            "doctor_id": "doc_8832",
            "encounter_type": "consultation"
        }
    }

@pytest.fixture
def non_compliant_consent_payload(valid_synthetic_request_payload) -> Dict[str, Any]:
    """Payload explicitly violating the patient consent policy gate."""
    payload = valid_synthetic_request_payload.copy()
    payload["patient_consent_verified"] = False
    return payload

@pytest.fixture
def clinical_automation_payload(valid_synthetic_request_payload) -> Dict[str, Any]:
    """Payload explicitly attempting prohibited clinical triage automation."""
    payload = valid_synthetic_request_payload.copy()
    payload["is_clinical_automation"] = True
    return payload 