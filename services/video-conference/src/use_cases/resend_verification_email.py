"""Resend verification email - with 3 attempts/day and 1-day lockout."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import (
    EmailVerificationOtpDB,
    EmailVerificationTokenDB,
    TokenType,
    UserDB,
)
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template
from src.use_cases.token_lockout import (
    build_lockout_payload,
    count_attempts_with_created_tokens,
    create_or_extend_lockout,
    get_active_lockout,
    raise_lockout_http_exception,
)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def _check_lockout(db: Session, user_id, token_type: str):
    return get_active_lockout(db, user_id, token_type)


def _count_attempts(db: Session, user_id, token_type: str) -> int:
    return count_attempts_with_created_tokens(
        db=db,
        user_id=user_id,
        token_type=token_type,
        window_hours=config.RESEND_ATTEMPTS_WINDOW_HOURS,
        token_model=EmailVerificationTokenDB,
    )


def _create_lockout(db: Session, user_id, token_type: str) -> None:
    create_or_extend_lockout(db, user_id, token_type, config.LOCKOUT_HOURS)


def execute(email: str, db: Session) -> dict:
    """
    Resend verification email — generates a fresh link token + fresh OTP.

    Flow:
    1. Find user by email, must be PENDING_VERIFICATION
    2. Check lockout
    3. Count attempts (resends + failed verifies) in last 24h
    4. If >= 3, create lockout and reject
    5. Invalidate old link tokens and old OTPs
    6. Create new link token + new OTP, send email with both
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        raise HTTPException(status_code=400, detail={"error_code": "EMAIL_VERIFICATION_FAILED"})

    if user.status != CONFIG_USER.STATUS.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "EMAIL_VERIFICATION_FAILED"},
        )

    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "EMAIL_VERIFICATION_FAILED"},
        )

    lockout = _check_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
    if lockout:
        payload = build_lockout_payload(
            locked_until=lockout.locked_until,
            error_code="EMAIL_VERIFICATION_LOCKED",
            message="Too many attempts. Try again later.",
            lockout_hours=config.LOCKOUT_HOURS,
            attempts_limit=config.RESEND_ATTEMPTS_LIMIT,
        )
        raise_lockout_http_exception(payload)

    attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        locked_until = datetime.now(timezone.utc) + timedelta(hours=config.LOCKOUT_HOURS)
        _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        db.commit()
        payload = build_lockout_payload(
            locked_until=locked_until,
            error_code="EMAIL_VERIFICATION_LOCKED",
            message="Too many attempts. Try again later.",
            lockout_hours=config.LOCKOUT_HOURS,
            attempts_limit=config.RESEND_ATTEMPTS_LIMIT,
        )
        raise_lockout_http_exception(payload)

    now = datetime.now(timezone.utc)

    # Invalidate old link tokens
    db.query(EmailVerificationTokenDB).filter(
        EmailVerificationTokenDB.user_id == user.id,
        EmailVerificationTokenDB.used_at.is_(None),
        EmailVerificationTokenDB.invalidated_at.is_(None),
    ).update({EmailVerificationTokenDB.invalidated_at: now}, synchronize_session=False)

    # Invalidate old OTPs
    db.query(EmailVerificationOtpDB).filter(
        EmailVerificationOtpDB.user_id == user.id,
        EmailVerificationOtpDB.used_at.is_(None),
        EmailVerificationOtpDB.invalidated_at.is_(None),
    ).update({EmailVerificationOtpDB.invalidated_at: now}, synchronize_session=False)

    # New link token
    raw_token = secrets.token_urlsafe(32)
    link_expires_at = now + timedelta(hours=config.EMAIL_VERIFICATION_EXPIRY_HOURS)
    db.add(EmailVerificationTokenDB(
        user_id=user.id,
        token_hash=_hash(raw_token),
        expires_at=link_expires_at,
    ))

    # New OTP
    raw_otp = _generate_otp()
    otp_expires_at = now + timedelta(minutes=config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES)
    db.add(EmailVerificationOtpDB(
        user_id=user.id,
        otp_hash=_hash(raw_otp),
        expires_at=otp_expires_at,
    ))

    verification_link = f"{config.EMAIL_VERIFICATION_LINK_BASE}?token={raw_token}"

    subject, html_body, text_body = load_email_template(
        "welcome_verification",
        context={
            "user_name": user.first_name,
            "verification_link": verification_link,
            "expiry_hours": config.EMAIL_VERIFICATION_EXPIRY_HOURS,
            "otp_code": raw_otp,
            "otp_expiry_minutes": config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES,
        },
    )

    send_email(to_email=email_lower, subject=subject, html_body=html_body, text_body=text_body)
    db.commit()

    return {"message": "Verification email sent."}
