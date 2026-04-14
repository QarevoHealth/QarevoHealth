"""Verify doctor login 2FA email OTP."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.models import Login2FAOtpDB, Login2FASessionDB, UserDB


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def execute(user: UserDB, code: str, db: Session) -> dict:
    """Verify EMAIL OTP for the latest active doctor login 2FA session."""
    if user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=403, detail="Doctor access required.")

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
        raise HTTPException(status_code=400, detail="No active 2FA session found. Request a new OTP.")

    otp_record = (
        db.query(Login2FAOtpDB)
        .filter(
            Login2FAOtpDB.user_id == user.id,
            Login2FAOtpDB.session_id == session.id,
            Login2FAOtpDB.otp_type == "EMAIL",
        )
        .order_by(Login2FAOtpDB.created_at.desc())
        .first()
    )
    if not otp_record:
        raise HTTPException(status_code=400, detail="No email OTP found. Request a new OTP.")

    if otp_record.invalidated_at is not None:
        raise HTTPException(status_code=400, detail="This code has been replaced. Request a new OTP.")
    if otp_record.used_at is not None:
        raise HTTPException(status_code=400, detail="This code has already been used.")
    if otp_record.expires_at < now:
        raise HTTPException(status_code=400, detail="This code has expired. Request a new OTP.")
    if _hash(code) != otp_record.otp_hash:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    otp_record.used_at = now
    session.email_otp_verified = True
    db.commit()

    return {
        "message": "Email OTP verified.",
        "email_otp_verified": session.email_otp_verified,
        "phone_otp_verified": session.phone_otp_verified,
    }
