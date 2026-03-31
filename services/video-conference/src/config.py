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
    AWS_CHIME_REGION: str = os.getenv("AWS_CHIME_REGION", "")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    APP_JOIN_URL: str = os.getenv("APP_JOIN_URL", "http://localhost:3000/join")

    # AWS SES (email)
    AWS_SES_REGION: str = os.getenv("AWS_SES_REGION", os.getenv("AWS_CHIME_REGION", "us-east-1"))
    AWS_SES_FROM_EMAIL: str = os.getenv("AWS_SES_FROM_EMAIL", "")
    EMAIL_VERIFICATION_LINK_BASE: str = os.getenv(
        "EMAIL_VERIFICATION_LINK_BASE", "https://app.qarevohealth.com/verify-email"
    )
    EMAIL_VERIFICATION_SUCCESS_URL: str = os.getenv(
        "EMAIL_VERIFICATION_SUCCESS_URL", "https://app.qarevohealth.com"
    )
    EMAIL_VERIFICATION_EXPIRY_HOURS: int = int(os.getenv("EMAIL_VERIFICATION_EXPIRY_HOURS", "24"))
    EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES: int = int(os.getenv("EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES", "10"))
    RESEND_ATTEMPTS_LIMIT: int = int(os.getenv("RESEND_ATTEMPTS_LIMIT", "3"))
    RESEND_ATTEMPTS_WINDOW_HOURS: int = int(os.getenv("RESEND_ATTEMPTS_WINDOW_HOURS", "24"))
    LOCKOUT_HOURS: int = int(os.getenv("LOCKOUT_HOURS", "24"))

    # Password reset
    PASSWORD_RESET_EXPIRY_MINUTES: int = int(os.getenv("PASSWORD_RESET_EXPIRY_MINUTES", "60"))
    PASSWORD_RESET_LINK_BASE: str = os.getenv(
        "PASSWORD_RESET_LINK_BASE", "https://app.qarevohealth.com/reset-password"
    )
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # API
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    
    # Application
    APP_NAME: str = os.getenv("APP_NAME", "Qarevo Health Video Conference Service")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


# Create config instance
config = Config()
