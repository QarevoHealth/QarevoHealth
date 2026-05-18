"""Resend provider phone verification SMS."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import ResendPhoneVerificationRequest, ResendVerificationResponse
from src.use_cases.resend_verification_sms import execute as resend_verification_sms

router = APIRouter(prefix="/api/v1/auth/doctor", tags=["auth - doctor"])


@router.post("/resend-phone-verification", response_model=ResendVerificationResponse)
def resend_phone_verification_api(body: ResendPhoneVerificationRequest, db: Session = Depends(get_db)):
    result = resend_verification_sms(body.country_code, body.phone, db)
    return ResendVerificationResponse(**result)
