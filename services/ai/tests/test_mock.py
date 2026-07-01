import pytest
import uuid
from pydantic import ValidationError
from services.ai.schemas import AIDraftRequest
from services.ai.providers.mock import MockAIProvider
from services.ai.interface import AIService

@pytest.fixture
def mock_ai_service():
    provider = MockAIProvider()
    return AIService(provider=provider)

@pytest.mark.asyncio
async def test_successful_deterministic_draft(mock_ai_service):
    """Ensures a compliant request passes validation and yields a deterministic shape."""
    correlation_id = uuid.uuid4()
    
    valid_request = AIDraftRequest(
        correlation_id=correlation_id,
        patient_consent_verified=True,
        is_clinical_automation=False,
        verified_input_data={"note_id": 101}
    )
    
    response = await mock_ai_service.execute_drafting(valid_request)
    
    assert response.correlation_id == correlation_id
    assert response.status == "success"
    assert "subjective" in response.drafted_note
    assert response.drafted_note["assessment"] == "Headache, unspecified chronicity."

@pytest.mark.asyncio
async def test_policy_gate_rejection_missing_consent():
    """Ensures the schema hard-rejects processing when patient consent is unverified."""
    with pytest.raises(ValidationError) as exc_info:
        AIDraftRequest(
            correlation_id=uuid.uuid4(),
            patient_consent_verified=False,  # Policy Gate Violation
            is_clinical_automation=False
        )
    assert "Patient consent has not been verified" in str(exc_info.value)

@pytest.mark.asyncio
async def test_policy_gate_rejection_clinical_automation():
    """Ensures the schema hard-rejects processing if autonomous clinical triage is attempted."""
    with pytest.raises(ValidationError) as exc_info:
        AIDraftRequest(
            correlation_id=uuid.uuid4(),
            patient_consent_verified=True,
            is_clinical_automation=True  # Prohibited Content/Automation Violation
        )
    assert "Autonomous clinical triage or decision-making is prohibited" in str(exc_info.value)