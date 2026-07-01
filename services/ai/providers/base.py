from abc import ABC, abstractmethod
from services.ai.schemas import AIDraftRequest, AIDraftResponse

class BaseAIProvider(ABC):
    """
    Abstract Base Class defining the structural boundary for all AI service providers.
    """
    
    @abstractmethod
    async def generate_draft(self, request: AIDraftRequest) -> AIDraftResponse:
        """
        Processes a validated request and returns a structured schema response.
        """
        pass