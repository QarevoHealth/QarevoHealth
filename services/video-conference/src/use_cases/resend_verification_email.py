"""Resend verification email - with 3 attempts/day and 1-day lockout."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import (
    EmailVerificationTokenDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
    UserTokenLockoutDB,
)
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def _check_lockout(db: Session, user_id, token_type: str) -> UserTokenLockoutDB | None:
    """Return active lockout if user is locked, else None."""
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
    """Count resends + failed verifies in last 24h."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)

    # Resends: count tokens created in window
    resend_count = (
        db.query(func.count(EmailVerificationTokenDB.id))
        .filter(
            EmailVerificationTokenDB.user_id == user_id,
            EmailVerificationTokenDB.created_at >= window_start,
        )
        .scalar()
        or 0
    )

    # Failed verifies: count from user_token_attempts
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

    return resend_count + fail_count


def _create_lockout(db: Session, user_id, token_type: str) -> None:
    """Create or update lockout (1 day).."""
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
        lockout = UserTokenLockoutDB(
            user_id=user_id,
            token_type=token_type,
            locked_until=locked_until,
        )
        db.add(lockout)


def execute(email: str, db: Session) -> dict:
    """
    Resend verification email.

    Flow:
    1. Find user by email, must be PENDING_VERIFICATION
    2. Check lockout - if locked, reject
    3. Count attempts (resends + failed verifies) in last 24h
    4. If >= 3, create lockout and reject
    5. Create new token, invalidate old one, send email

    Returns {"message": "Verification email sent."}
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.status != CONFIG_USER.STATUS.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=400,
            detail="Email already verified or account not pending verification.",
        )

    # Check lockout
    lockout = _check_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
    if lockout:
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Please try again after {lockout.locked_until.isoformat()}.",
        )

    # Count attempts
    attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        db.commit()
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. You have been locked for {config.LOCKOUT_HOURS} hours. Please try again later.",
        )

    # Mark old tokens as invalidated (superseded by resend; keep rows for count; old links won't work)
    now = datetime.now(timezone.utc)
    db.query(EmailVerificationTokenDB).filter(
        EmailVerificationTokenDB.user_id == user.id,
        EmailVerificationTokenDB.used_at.is_(None),
        EmailVerificationTokenDB.invalidated_at.is_(None),
    ).update({EmailVerificationTokenDB.invalidated_at: now}, synchronize_session=False)

    # Create new token
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = now + timedelta(
        hours=config.EMAIL_VERIFICATION_EXPIRY_HOURS
    )

    token_record = EmailVerificationTokenDB(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token_record)

    verification_link = f"{config.EMAIL_VERIFICATION_LINK_BASE}?token={raw_token}"

    subject, html_body, text_body = load_email_template(
        "welcome_verification",
        context={
            "user_name": user.first_name,
            "verification_link": verification_link,
            "expiry_hours": config.EMAIL_VERIFICATION_EXPIRY_HOURS,
        },
    )

    send_email(to_email=email_lower, subject=subject, html_body=html_body, text_body=text_body)
    db.commit()

    return {"message": "Verification email sent."}
