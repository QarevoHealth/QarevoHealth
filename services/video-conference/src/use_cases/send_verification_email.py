"""Send email verification - create token, store in DB, send via AWS SES."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.config import config
from src.models import EmailVerificationTokenDB
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def execute(user_id: str, user_email: str, user_name: str, db: Session) -> None:
    """
    Create verification token, store in DB, send welcome + verification email.
    Does not raise on email send failure (user is already created).
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=config.EMAIL_VERIFICATION_EXPIRY_HOURS
    )

    token_record = EmailVerificationTokenDB(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token_record)

    verification_link = f"{config.EMAIL_VERIFICATION_LINK_BASE}?token={raw_token}"

    subject, html_body, text_body = load_email_template(
        "welcome_verification",
        context={
            "user_name": user_name,
            "verification_link": verification_link,
            "expiry_hours": config.EMAIL_VERIFICATION_EXPIRY_HOURS,
        },
    )

    send_email(to_email=user_email, subject=subject, html_body=html_body, text_body=text_body)
