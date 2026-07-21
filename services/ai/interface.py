from services.ai.providers.base import BaseAIProvider
from services.ai.schemas import AIDraftRequest, AIDraftResponse

class AIService:
    """
    Core AI Service Boundary Orchestrator.
    Handles provider routing and high-level execution policies.
    """
    def __init__(self, provider: BaseAIProvider):
        self._provider = provider

    async def execute_drafting(self, request: AIDraftRequest) -> AIDraftResponse:
        # The Pydantic schema handles input verification automatically on instantiation.
        # This layer delegates to the active, safe provider boundary.
        return await self._provider.generate_draft(request)