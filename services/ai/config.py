from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuration for AI Service."""
    ENVIRONMENT: str = "development"
    AI_PROVIDER_TYPE: str = "mock"  # Can be swapped to 'openai' or others later
    
    class Config:
        env_file = ".env"

settings = Settings()