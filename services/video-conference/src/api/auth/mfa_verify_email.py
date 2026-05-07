"""MFA email verification API - alias endpoint for login MFA flow."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.temp_auth import require_temp_auth_token
from src.schemas.auth import VerifyEmailCodeRequest, VerifyEmailCodeResponse
from src.use_cases.verify_mfa_email_otp import execute as verify_mfa_email_otp

router = APIRouter(prefix="/api/v1/auth/mfa", tags=["auth - mfa"])


@router.post("/verify-email", response_model=VerifyEmailCodeResponse)
def verify_email_mfa_api(
    body: VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
    _temp_auth: dict = Depends(require_temp_auth_token),
):
    """
    Verify email OTP for login MFA flow.

    This endpoint does NOT activate account or modify email_verified state.
    """
    result = verify_mfa_email_otp(
        body.email,
        body.code,
        db,
    )
    return VerifyEmailCodeResponse(**result)

