import os
from typing import Optional

class AIServiceSettings:
    """
    Infrastructure settings for the AI Service block.
    Uses standard environment variables with safe fallback defaults.
    """
    def __init__(self):
        # Feature Flag for future provider migration (Defaults to False)
        self.USE_REAL_AI_PROVIDER: bool = os.environ.get(
            "AI_SERVICE_USE_REAL_AI_PROVIDER", "False"
        ).lower() in ("true", "1", "yes")
        
        # Secrets placeholders (to be pulled from Secrets Manager in production)
        self.AI_PROVIDER_API_KEY: Optional[str] = os.environ.get(
            "AI_SERVICE_AI_PROVIDER_API_KEY", None
        )
        self.AI_MODEL_NAME: str = os.environ.get(
            "AI_SERVICE_AI_MODEL_NAME", "mock-a0-engine"
        )

# Instantiate settings to be imported across the service module
settings = AIServiceSettings()