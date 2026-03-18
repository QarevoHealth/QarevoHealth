"""Resend verification email API - with 3 attempts/day and 1-day lockout."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import ResendVerificationRequest, ResendVerificationResponse
from src.use_cases.resend_verification_email import execute as resend_verification_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/resend-verification-email", response_model=ResendVerificationResponse)
def resend_verification_email_api(
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Resend verification email.

    Checks:
    - User exists and is PENDING_VERIFICATION
    - User is not locked (1-day lock after 3 attempts)
    - Attempts in last 24h < 3 (resends + failed verifies)

    On success: creates new token (invalidates old), sends email.
    """
    result = resend_verification_email(body.email, db)
    return ResendVerificationResponse(**result)
