"""Auth API routes - register, verify-email, login, logout, refresh."""

from src.api.auth.register import router as register_router
from src.api.auth.verify_email import router as verify_email_router

__all__ = ["register_router", "verify_email_router"]