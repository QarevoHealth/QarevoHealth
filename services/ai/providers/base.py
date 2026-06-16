from abc import ABC
from services.ai.interface import IAIService

class BaseAIProvider(IAIService, ABC):
    """
    Internal base for all AI providers. 
    Add shared logic here (e.g., logging, error handling) 
    that all providers should inherit.
    """
    pass