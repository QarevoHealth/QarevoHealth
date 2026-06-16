import pytest
from uuid import uuid4
from services.ai.schemas import AIDraftRequest, AIRequestContext, AIPolicyGate

@pytest.fixture
def base_request():
    """Provides a standard, valid request fixture for tests."""
    return AIDraftRequest(
        context=AIRequestContext(
            correlation_id=uuid4(),
            operator_id="doc_789", 
            patient_id="pat_101"
        ),
        policy_gate=AIPolicyGate(
            has_patient_consent=True, 
            is_clinical_automation=False
        ),
        raw_symptoms="Patient exhibits moderate upper respiratory tract infection signs."
    )