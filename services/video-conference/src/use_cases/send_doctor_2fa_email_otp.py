"""Send doctor login 2FA email OTP."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import Login2FAOtpDB, Login2FASessionDB, UserDB
from src.services.email_service import send_email


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def execute(
    user: UserDB,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """Create/reuse active login 2FA session and send EMAIL OTP to doctor."""
    if user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=403, detail="Doctor access required.")

    if not user.email or not user.email_verified:
        raise HTTPException(status_code=403, detail="Verified email required for email OTP.")

    now = datetime.now(timezone.utc)
    session = (
        db.query(Login2FASessionDB)
        .filter(
            Login2FASessionDB.user_id == user.id,
            Login2FASessionDB.expires_at > now,
        )
        .order_by(Login2FASessionDB.created_at.desc())
        .first()
    )

    if not session:
        session = Login2FASessionDB(
            user_id=user.id,
            temp_token_hash=_hash(secrets.token_urlsafe(32)),
            email_otp_verified=False,
            phone_otp_verified=False,
            expires_at=now + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(session)
        db.flush()

    db.query(Login2FAOtpDB).filter(
        Login2FAOtpDB.user_id == user.id,
        Login2FAOtpDB.session_id == session.id,
        Login2FAOtpDB.otp_type == "EMAIL",
        Login2FAOtpDB.used_at.is_(None),
        Login2FAOtpDB.invalidated_at.is_(None),
    ).update({Login2FAOtpDB.invalidated_at: now}, synchronize_session=False)

    raw_otp = _generate_otp()
    otp_record = Login2FAOtpDB(
        user_id=user.id,
        session_id=session.id,
        otp_type="EMAIL",
        otp_hash=_hash(raw_otp),
        expires_at=now + timedelta(minutes=config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES),
    )
    db.add(otp_record)

    subject = "Your Qarevo doctor login verification code"
    html_body = (
        f"<p>Hello Dr. {user.first_name},</p>"
        f"<p>Your login verification code is <b>{raw_otp}</b>.</p>"
        f"<p>This code expires in {config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES} minutes.</p>"
    )
    text_body = (
        f"Hello Dr. {user.first_name},\n"
        f"Your login verification code is {raw_otp}.\n"
        f"This code expires in {config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES} minutes."
    )
    sent = send_email(
        to_email=user.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )
    if not sent:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to send email OTP.")

    db.commit()
    return {"message": "Email OTP sent."}
