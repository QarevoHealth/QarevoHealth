"""MFA phone verification API - alias endpoint for login MFA flow."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.temp_auth import require_temp_auth_token
from src.schemas.auth import VerifyPhoneCodeRequest, VerifyPhoneCodeResponse
from src.use_cases.verify_mfa_phone_otp import execute as verify_mfa_phone_otp

router = APIRouter(prefix="/api/v1/auth/mfa", tags=["auth - mfa"])


@router.post("/verify-phone", response_model=VerifyPhoneCodeResponse)
def verify_phone_mfa_api(
    body: VerifyPhoneCodeRequest,
    db: Session = Depends(get_db),
    _temp_auth: dict = Depends(require_temp_auth_token),
):
    """
    Verify phone OTP for login MFA flow.

    This endpoint does NOT activate account or modify phone_verified state.
    """
    result = verify_mfa_phone_otp(
        body.country_code,
        body.phone,
        body.code,
        db,
    )
    return VerifyPhoneCodeResponse(**result)

