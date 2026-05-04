"""Doctor login 2FA email APIs."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.database import get_db
from src.dependencies.auth import get_current_user
from src.dependencies.client_info import ClientInfo, get_client_info
from src.models import UserDB
from src.schemas.doctor import (
    Doctor2FAEmailSendResponse,
    Doctor2FAEmailVerifyRequest,
    Doctor2FAEmailVerifyResponse,
)
from src.use_cases.send_doctor_2fa_email_otp import execute as send_doctor_2fa_email_otp
from src.use_cases.verify_doctor_2fa_email_otp import execute as verify_doctor_2fa_email_otp

router = APIRouter(prefix="/api/v1/auth/doctor/2fa/email", tags=["auth"])


@router.post("/send", response_model=Doctor2FAEmailSendResponse)
def send_doctor_2fa_email_otp_api(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
    client: ClientInfo = Depends(get_client_info),
):
    """Send doctor login 2FA email OTP using user details from access token."""
    if current_user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=403, detail="Doctor access required.")

    result = send_doctor_2fa_email_otp(
        user=current_user,
        db=db,
        ip_address=client.ip_address,
        user_agent=client.user_agent,
    )
    return Doctor2FAEmailSendResponse(**result)


@router.post("/verify", response_model=Doctor2FAEmailVerifyResponse)
def verify_doctor_2fa_email_otp_api(
    body: Doctor2FAEmailVerifyRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """Verify doctor login 2FA email OTP for current token user."""
    if current_user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=403, detail="Doctor access required.")

    result = verify_doctor_2fa_email_otp(user=current_user, code=body.code, db=db)
    return Doctor2FAEmailVerifyResponse(**result)
