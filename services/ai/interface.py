from abc import ABC, abstractmethod
from services.ai.schemas import AIDraftRequest, AIDraftResponse

class IAIService(ABC):
    """Abstract Base Class establishing the Qarevo WS-AI service boundary."""
    
    @abstractmethod
    async def generate_summary_draft(self, request: AIDraftRequest) -> AIDraftResponse:
        """Transforms verified inputs into clinical documentation drafts."""
        pass