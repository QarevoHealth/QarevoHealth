"""Request password reset - sends email with link. Always returns success for security."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.config import config
from src.models import PasswordResetTokenDB, UserDB
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def execute(email: str, db: Session) -> dict:
    """
    Request password reset - sends email with link if user exists.

    Always returns success (200) for security - do not reveal if email exists.
    If user exists: create token, invalidate old tokens, send email.
    If user does not exist: return success without sending.
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        return {"message": "If an account exists with this email, a password reset link has been sent."}

    # Invalidate any existing unused tokens for this user
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
            "user_name": user.full_name or "User",
            "reset_link": reset_link,
            "expiry_minutes": config.PASSWORD_RESET_EXPIRY_MINUTES,
        },
    )

    send_email(to_email=email_lower, subject=subject, html_body=html_body, text_body=text_body)
    db.commit()

    return {"message": "If an account exists with this email, a password reset link has been sent."}
