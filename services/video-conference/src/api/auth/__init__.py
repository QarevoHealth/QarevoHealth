"""Auth API routes - shared for all roles: login, logout, refresh, verify-email, forgot-password, reset-password."""

from src.api.auth.forgot_password import router as forgot_password_router
from src.api.auth.login import router as login_router
from src.api.auth.logout import router as logout_router
from src.api.auth.refresh_token import router as refresh_token_router
from src.api.auth.register_doctor import router as register_doctor_router
from src.api.auth.resend_password_reset import router as resend_password_reset_router
from src.api.auth.resend_verification_email import router as resend_verification_router
from src.api.auth.reset_password import router as reset_password_router
from src.api.auth.verify_email import router as verify_email_router
from src.api.auth.verify_email_code import router as verify_email_code_router

__all__ = [
    "forgot_password_router",
    "login_router",
    "logout_router",
    "refresh_token_router",
    "register_doctor_router",
    "resend_password_reset_router",
    "resend_verification_router",
    "reset_password_router",
    "verify_email_router",
    "verify_email_code_router",
]
