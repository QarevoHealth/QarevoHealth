"""Resend email OTP for login MFA with lockout handling."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import (
    AttemptType,
    EmailVerificationOtpDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
)
from src.services.email_service import send_email
from src.use_cases.token_lockout import (
    build_lockout_payload,
    create_or_extend_lockout,
    get_active_lockout,
    raise_lockout_http_exception,
)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def _count_attempts(db: Session, user_id) -> int:
    window_start = datetime.now(timezone.utc) - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)
    return (
        db.query(UserTokenAttemptDB)
        .filter(
            UserTokenAttemptDB.user_id == user_id,
            UserTokenAttemptDB.token_type == TokenType.OTP_EMAIL_MFA,
            UserTokenAttemptDB.attempted_at >= window_start,
        )
        .count()
    )


def execute(email: str, db: Session) -> dict:
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        raise HTTPException(status_code=400, detail={"error_code": "MFA_EMAIL_RESEND_FAILED"})

    if (
        user.role != CONFIG_USER.ROLE.PROVIDER
        or user.status != CONFIG_USER.STATUS.ACTIVE
        or not user.email_verified
        or not user.phone_verified
    ):
        raise HTTPException(status_code=400, detail={"error_code": "MFA_EMAIL_RESEND_FAILED"})

    lockout = get_active_lockout(db, user.id, TokenType.OTP_EMAIL_MFA)
    if lockout:
        payload = build_lockout_payload(
            locked_until=lockout.locked_until,
            error_code="MFA_EMAIL_LOCKED",
            message="Too many attempts. Try again later.",
            lockout_hours=config.LOCKOUT_HOURS,
            attempts_limit=config.RESEND_ATTEMPTS_LIMIT,
        )
        raise_lockout_http_exception(payload)

    attempts = _count_attempts(db, user.id)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        create_or_extend_lockout(db, user.id, TokenType.OTP_EMAIL_MFA, config.LOCKOUT_HOURS)
        db.commit()
        locked_until = datetime.now(timezone.utc) + timedelta(hours=config.LOCKOUT_HOURS)
        payload = build_lockout_payload(
            locked_until=locked_until,
            error_code="MFA_EMAIL_LOCKED",
            message="Too many attempts. Try again later.",
            lockout_hours=config.LOCKOUT_HOURS,
            attempts_limit=config.RESEND_ATTEMPTS_LIMIT,
        )
        raise_lockout_http_exception(payload)

    now = datetime.now(timezone.utc)
    db.query(EmailVerificationOtpDB).filter(
        EmailVerificationOtpDB.user_id == user.id,
        EmailVerificationOtpDB.used_at.is_(None),
        EmailVerificationOtpDB.invalidated_at.is_(None),
    ).update({EmailVerificationOtpDB.invalidated_at: now}, synchronize_session=False)

    raw_otp = _generate_otp()
    db.add(
        EmailVerificationOtpDB(
            user_id=user.id,
            otp_hash=_hash(raw_otp),
            expires_at=now + timedelta(minutes=config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES),
        )
    )

    db.add(
        UserTokenAttemptDB(
            user_id=user.id,
            token_type=TokenType.OTP_EMAIL_MFA,
            attempt_type=AttemptType.OTP_RESEND,
        )
    )

    subject = "Your Qarevo login verification code"
    text_body = (
        f"Your login verification code is {raw_otp}. "
        f"It expires in {config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES} minutes."
    )
    html_body = f"<p>{text_body}</p>"
    send_email(to_email=email_lower, subject=subject, html_body=html_body, text_body=text_body)

    db.commit()
    return {"message": "MFA email code sent."}

