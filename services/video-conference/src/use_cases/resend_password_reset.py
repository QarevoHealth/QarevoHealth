"""Resend password reset email - with 3 attempts/day and 1-day lockout."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.config import config
from src.models import (
    PasswordResetTokenDB,
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
    """Count resends + failed resets in last 24h."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)

    # Resends: count tokens created in window
    resend_count = (
        db.query(func.count(PasswordResetTokenDB.id))
        .filter(
            PasswordResetTokenDB.user_id == user_id,
            PasswordResetTokenDB.created_at >= window_start,
        )
        .scalar()
        or 0
    )

    # Failed resets: count from user_token_attempts
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
    """Create or update lockout (1 day)."""
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
    Resend password reset email.

    Flow:
    1. Find user by email
    2. Check lockout - if locked, reject
    3. Count attempts (resends + failed resets) in last 24h
    4. If >= 3, create lockout and reject
    5. Create new token, invalidate old one, send email

    Returns {"message": "Password reset email sent."}
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        # Same as forgot-password: don't reveal if user exists
        return {"message": "Unable to find user."}

    # Check lockout
    lockout = _check_lockout(db, user.id, TokenType.PASSWORD_RESET)
    if lockout:
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Please try again after {lockout.locked_until.isoformat()}.",
        )

    # Count attempts
    attempts = _count_attempts(db, user.id, TokenType.PASSWORD_RESET)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        _create_lockout(db, user.id, TokenType.PASSWORD_RESET)
        db.commit()
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. You have been locked for {config.LOCKOUT_HOURS} hours. Please try again later.",
        )

    # Mark old tokens as invalidated
    now = datetime.now(timezone.utc)
    db.query(PasswordResetTokenDB).filter(
        PasswordResetTokenDB.user_id == user.id,
        PasswordResetTokenDB.used_at.is_(None),
        PasswordResetTokenDB.invalidated_at.is_(None),
    ).update({PasswordResetTokenDB.invalidated_at: now}, synchronize_session=False)

    # Create new token
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = now + timedelta(minutes=config.PASSWORD_RESET_EXPIRY_MINUTES)

    token_record = PasswordResetTokenDB(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token_record)

    reset_link = f"{config.PASSWORD_RESET_LINK_BASE}?token={raw_token}"

    subject, html_body, text_body = load_email_template(
        "password_reset",
        context={
            "user_name": user.first_name or "User",
            "reset_link": reset_link,
            "expiry_minutes": config.PASSWORD_RESET_EXPIRY_MINUTES,
        },
    )

    send_email(to_email=email_lower, subject=subject, html_body=html_body, text_body=text_body)
    db.commit()

    return {"message": "Password reset email sent."}
