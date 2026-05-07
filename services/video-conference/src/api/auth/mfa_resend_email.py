"""Resend email OTP for login MFA."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.temp_auth import require_temp_auth_token
from src.schemas.auth import ResendVerificationRequest, ResendVerificationResponse
from src.use_cases.resend_mfa_email_otp import execute as resend_mfa_email_otp

router = APIRouter(prefix="/api/v1/auth/mfa", tags=["auth - mfa"])


@router.post("/resend-email", response_model=ResendVerificationResponse)
def resend_email_mfa_api(
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
    _temp_auth: dict = Depends(require_temp_auth_token),
):
    result = resend_mfa_email_otp(body.email, db)
    return ResendVerificationResponse(**result)

