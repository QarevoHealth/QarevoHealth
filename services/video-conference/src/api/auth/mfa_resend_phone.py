"""Resend phone OTP for login MFA."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.temp_auth import require_temp_auth_token
from src.schemas.auth import ResendPhoneVerificationRequest, ResendVerificationResponse
from src.use_cases.resend_mfa_phone_otp import execute as resend_mfa_phone_otp

router = APIRouter(prefix="/api/v1/auth/mfa", tags=["auth - mfa"])


@router.post("/resend-phone", response_model=ResendVerificationResponse)
def resend_phone_mfa_api(
    body: ResendPhoneVerificationRequest,
    db: Session = Depends(get_db),
    _temp_auth: dict = Depends(require_temp_auth_token),
):
    result = resend_mfa_phone_otp(body.country_code, body.phone, db)
    return ResendVerificationResponse(**result)

