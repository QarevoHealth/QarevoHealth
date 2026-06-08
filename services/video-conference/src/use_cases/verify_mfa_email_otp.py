"""Verify email OTP for login MFA without changing account verification state."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.models import EmailVerificationOtpDB, UserDB


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def execute(email: str, code: str, db: Session) -> dict:
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if (
        user.role != CONFIG_USER.ROLE.PROVIDER
        or user.status != CONFIG_USER.STATUS.ACTIVE
        or not user.email_verified
    ):
        raise HTTPException(status_code=400, detail="Email MFA is not available for this account.")

    otp_record = (
        db.query(EmailVerificationOtpDB)
        .filter(EmailVerificationOtpDB.user_id == user.id)
        .order_by(EmailVerificationOtpDB.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="No verification code found.")

    now = datetime.now(timezone.utc)

    if otp_record.invalidated_at is not None:
        raise HTTPException(status_code=400, detail="This code has been replaced.")

    if otp_record.used_at is not None:
        raise HTTPException(status_code=400, detail="This code has already been used.")

    if otp_record.expires_at < now:
        raise HTTPException(status_code=400, detail="This code has expired.")

    if _hash(code) != otp_record.otp_hash:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    otp_record.used_at = now
    db.commit()
    return {"message": "MFA email code verified successfully."}

