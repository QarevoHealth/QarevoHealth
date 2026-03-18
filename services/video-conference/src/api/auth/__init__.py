"""Auth API routes - register, verify-email, resend-verification, login, refresh."""

from src.api.auth.login import router as login_router
from src.api.auth.register import router as register_router
from src.api.auth.resend_verification_email import router as resend_verification_router
from src.api.auth.verify_email import router as verify_email_router

__all__ = [
    "login_router",
    "register_router",
    "resend_verification_router",
    "verify_email_router",
]
