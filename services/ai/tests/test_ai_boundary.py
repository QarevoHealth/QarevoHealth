import pytest
from uuid import uuid4
from fastapi import HTTPException
from pydantic import ValidationError
from services.ai.schemas import AIDraftRequest, AIRequestContext, AIPolicyGate
from services.ai.providers.mock import MockAIProvider

@pytest.mark.asyncio
async def test_mock_provider_success_path():
    """Verifies that the mock provider produces a clean, deterministic draft with safe inputs."""
    provider = MockAIProvider()
    request = AIDraftRequest(
        context=AIRequestContext(operator_id="doc_789", patient_id="pat_101"),
        policy_gate=AIPolicyGate(has_patient_consent=True, is_clinical_automation=False),
        raw_symptoms="Patient exhibits moderate upper respiratory tract infection signs."
    )
    
    response = await provider.generate_summary_draft(request)
    
    assert response.provider_utilized == "MockEngineV1"
    assert "CLINICAL SUMMARY DRAFT" in response.drafted_summary
    assert response.correlation_id == request.context.correlation_id

@pytest.mark.asyncio
async def test_policy_gate_blocks_missing_consent():
    """Verifies the security boundary rejects processing if patient consent is missing."""
    provider = MockAIProvider()
    request = AIDraftRequest(
        context=AIRequestContext(operator_id="doc_789", patient_id="pat_101"),
        policy_gate=AIPolicyGate(has_patient_consent=False, is_clinical_automation=False),
        raw_symptoms="Patient exhibits moderate upper respiratory tract infection signs."
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await provider.generate_summary_draft(request)
        
    assert exc_info.value.status_code == 403
    assert "Security Boundary Violation" in exc_info.value.detail

def test_prohibited_content_baseline_automation():
    """Verifies the Pydantic schema actively kills execution if clinical automation is attempted."""
    with pytest.raises(ValidationError) as exc_info:
        AIPolicyGate(has_patient_consent=True, is_clinical_automation=True)
        
    assert "Clinical automation/triage is strictly disabled" in str(exc_info.value)