"""Verify provider phone via SMS OTP."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import VerifyPhoneCodeRequest, VerifyPhoneCodeResponse
from src.use_cases.verify_phone_otp import execute as verify_phone_otp

router = APIRouter(prefix="/api/v1/auth/doctor", tags=["auth - doctor"])


@router.post("/verify-phone-code", response_model=VerifyPhoneCodeResponse)
def verify_phone_code_api(
    body: VerifyPhoneCodeRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    result = verify_phone_otp(
        body.country_code,
        body.phone,
        body.code,
        db,
        ip_address=client.ip_address,
        user_agent=client.user_agent,
    )
    return VerifyPhoneCodeResponse(**result)
