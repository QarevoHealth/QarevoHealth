from fastapi import HTTPException, status
from services.ai.interface import IAIService
from services.ai.schemas import AIDraftRequest, AIDraftResponse

class MockAIProvider(IAIService):
    """Deterministic provider for safe local testing and validation workflows."""

    async def generate_summary_draft(self, request: AIDraftRequest) -> AIDraftResponse:
        # 1. Enforce Policy Gate Guardrails natively
        if not request.policy_gate.has_patient_consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Boundary Violation: No patient consent provided for data processing."
            )
        
        # 2. Return a predictable mapping of the input components to satisfy test baselines
        mock_summary = (
            f"CLINICAL SUMMARY DRAFT\n"
            f"Patient Context verified. Input analyzed: '{request.raw_symptoms[:50]}...'\n"
            f"Recommended operational documentation support initialized successfully."
        )

        return AIDraftResponse(
            correlation_id=request.context.correlation_id,
            drafted_summary=mock_summary,
            provider_utilized="MockEngineV1"
        )