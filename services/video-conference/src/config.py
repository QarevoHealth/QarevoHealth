"""Configuration from environment variables."""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration."""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./video_conference.db")
    
    # AWS Chime
    AWS_CHIME_REGION: str = os.getenv("AWS_CHIME_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    APP_JOIN_URL: str = os.getenv("APP_JOIN_URL", "http://localhost:3000/join")

    # AWS SES (email)
    AWS_SES_REGION: str = os.getenv("AWS_SES_REGION", os.getenv("AWS_CHIME_REGION", "us-east-1"))
    AWS_SES_FROM_EMAIL: str = os.getenv("AWS_SES_FROM_EMAIL", "noreply@qarevohealth.com")
    EMAIL_VERIFICATION_LINK_BASE: str = os.getenv(
        "EMAIL_VERIFICATION_LINK_BASE", "https://app.qarevohealth.com/verify-email"
    )
    EMAIL_VERIFICATION_EXPIRY_HOURS: int = int(os.getenv("EMAIL_VERIFICATION_EXPIRY_HOURS", "24"))
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # API
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    
    # Application
    APP_NAME: str = os.getenv("APP_NAME", "Video Conference Service")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


# Create config instance
config = Config()
