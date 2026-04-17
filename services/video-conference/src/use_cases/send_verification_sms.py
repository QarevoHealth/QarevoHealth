"""Create phone verification OTP and send via AWS SNS (providers)."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.config import config
from src.models import PhoneVerificationOtpDB
from src.services.sms_service import send_sms, to_e164


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def execute(user_id, country_code: str, phone: str, db: Session) -> None:
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] send_verification_sms execute "
        f"user_id={user_id} country_code={country_code!r} phone={phone!r}"
    )
    now = datetime.now(timezone.utc)
    raw_otp = _generate_otp()
    otp_expires_at = now + timedelta(minutes=config.PHONE_VERIFICATION_OTP_EXPIRY_MINUTES)
    db.add(
        PhoneVerificationOtpDB(
            user_id=user_id,
            otp_hash=_hash(raw_otp),
            expires_at=otp_expires_at,
        )
    )
    e164 = to_e164(country_code, phone)
    body = (
        f"Your verification code is {raw_otp}. "
        f"It expires in {config.PHONE_VERIFICATION_OTP_EXPIRY_MINUTES} minutes."
    )
    sms_ok = send_sms(e164, body)
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] send_verification_sms result "
        f"user_id={user_id} to={e164!r} sent={sms_ok}"
    )
