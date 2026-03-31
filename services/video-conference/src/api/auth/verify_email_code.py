"""Verify email code API - validate 6-digit OTP entered by user."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import VerifyEmailCodeRequest, VerifyEmailCodeResponse
from src.use_cases.verify_email_otp import execute as verify_email_otp

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/verify-email-code", response_model=VerifyEmailCodeResponse)
def verify_email_code_api(
    body: VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """
    Verify email using the 6-digit OTP code sent on registration.

    Alternative to clicking the verification link.
    Rate limit: 3 failed attempts locks the user for 24 hours.
    """
    result = verify_email_otp(body.email, body.code, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return VerifyEmailCodeResponse(**result)
