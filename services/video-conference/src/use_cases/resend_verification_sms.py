"""Resend provider phone OTP with attempt limits."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import (
    PhoneVerificationOtpDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
    UserTokenLockoutDB,
)
from src.services.sms_service import send_sms, to_e164


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def _check_lockout(db: Session, user_id, token_type: str) -> UserTokenLockoutDB | None:
    now = datetime.now(timezone.utc)
    return (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == token_type,
            UserTokenLockoutDB.locked_until > now,
        )
        .first()
    )


def _count_attempts(db: Session, user_id, token_type: str) -> int:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)

    otp_creates = (
        db.query(func.count(PhoneVerificationOtpDB.id))
        .filter(
            PhoneVerificationOtpDB.user_id == user_id,
            PhoneVerificationOtpDB.created_at >= window_start,
        )
        .scalar()
        or 0
    )

    fail_count = (
        db.query(func.count(UserTokenAttemptDB.id))
        .filter(
            UserTokenAttemptDB.user_id == user_id,
            UserTokenAttemptDB.token_type == token_type,
            UserTokenAttemptDB.attempted_at >= window_start,
        )
        .scalar()
        or 0
    )

    return otp_creates + fail_count


def _create_lockout(db: Session, user_id, token_type: str) -> None:
    now = datetime.now(timezone.utc)
    locked_until = now + timedelta(hours=config.LOCKOUT_HOURS)

    existing = (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == token_type,
        )
        .first()
    )
    if existing:
        existing.locked_until = locked_until
        existing.created_at = now
    else:
        db.add(
            UserTokenLockoutDB(
                user_id=user_id,
                token_type=token_type,
                locked_until=locked_until,
            )
        )


def execute(country_code: str, phone: str, db: Session) -> dict:
    cc = country_code.strip()
    phone_digits = "".join(ch for ch in phone if ch.isdigit())
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] resend_verification_sms execute "
        f"country_code={cc!r} phone={phone_digits!r}"
    )
    user = db.query(UserDB).filter(
        UserDB.country_code == cc,
        UserDB.phone == phone_digits,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=400, detail="SMS verification resend is only for provider accounts.")

    if not user.email_verified:
        raise HTTPException(status_code=400, detail="Verify your email before requesting a phone code.")

    if user.phone_verified:
        raise HTTPException(status_code=400, detail="Phone already verified.")

    if user.status != CONFIG_USER.STATUS.PENDING_VERIFICATION:
        raise HTTPException(status_code=400, detail="Account is not awaiting phone verification.")

    if not user.country_code or not user.phone:
        raise HTTPException(status_code=400, detail="No phone number on file.")

    lockout = _check_lockout(db, user.id, TokenType.OTP_PHONE_VERIFICATION)
    if lockout:
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Please try again after {lockout.locked_until.isoformat()}.",
        )

    attempts = _count_attempts(db, user.id, TokenType.OTP_PHONE_VERIFICATION)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        _create_lockout(db, user.id, TokenType.OTP_PHONE_VERIFICATION)
        db.commit()
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. You have been locked for {config.LOCKOUT_HOURS} hours. Please try again later.",
        )

    now = datetime.now(timezone.utc)
    db.query(PhoneVerificationOtpDB).filter(
        PhoneVerificationOtpDB.user_id == user.id,
        PhoneVerificationOtpDB.used_at.is_(None),
        PhoneVerificationOtpDB.invalidated_at.is_(None),
    ).update({PhoneVerificationOtpDB.invalidated_at: now}, synchronize_session=False)

    raw_otp = _generate_otp()
    otp_expires_at = now + timedelta(minutes=config.PHONE_VERIFICATION_OTP_EXPIRY_MINUTES)
    db.add(
        PhoneVerificationOtpDB(
            user_id=user.id,
            otp_hash=_hash(raw_otp),
            expires_at=otp_expires_at,
        )
    )

    e164 = to_e164(user.country_code, user.phone)
    body = (
        f"Your verification code is {raw_otp}. "
        f"It expires in {config.PHONE_VERIFICATION_OTP_EXPIRY_MINUTES} minutes."
    )
    sms_ok = send_sms(e164, body)
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] resend_verification_sms result "
        f"user_id={user.id} to={e164!r} sent={sms_ok} attempts={attempts}"
    )
    db.commit()

    return {"message": "Verification SMS sent."}
