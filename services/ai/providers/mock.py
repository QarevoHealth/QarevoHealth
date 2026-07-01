from services.ai.providers.base import BaseAIProvider
from services.ai.schemas import AIDraftRequest, AIDraftResponse

class MockAIProvider(BaseAIProvider):
    """
    Deterministic Mock Provider satisfying the air-gapped safety requirements.
    Does not connect to external third-party AI vendors.
    """
    
    async def generate_draft(self, request: AIDraftRequest) -> AIDraftResponse:
        # Enforce deterministic output structure mapping to a standard SOAP doctor note format
        deterministic_note_shape = {
            "subjective": "Patient reports mild, intermittent headaches over the past two weeks. No vision changes.",
            "objective": "Vitals stable. Neurological exam within normal limits.",
            "assessment": "Headache, unspecified chronicity.",
            "plan": "Monitor symptoms. Maintain a hydration log. Follow up if severity increases."
        }
        
        return AIDraftResponse(
            correlation_id=request.correlation_id,
            status="success",
            drafted_note=deterministic_note_shape
        )