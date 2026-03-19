"""Resend password reset email API - with 3 attempts/day and 1-day lockout."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import ResendPasswordResetRequest, ResendPasswordResetResponse
from src.use_cases.resend_password_reset import execute as resend_password_reset

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/resend-password-reset", response_model=ResendPasswordResetResponse)
def resend_password_reset_api(
    body: ResendPasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Resend password reset email.

    Checks:
    - User exists (returns success anyway for security)
    - User is not locked (1-day lock after 3 attempts)
    - Attempts in last 24h < 3 (resends + failed resets)

    On success: creates new token (invalidates old), sends email.
    """
    result = resend_password_reset(body.email, db)
    return ResendPasswordResetResponse(**result)
