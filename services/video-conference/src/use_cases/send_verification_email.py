"""Send email verification - create link token + OTP, store in DB, send via AWS SES."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.config import config
from src.models import EmailVerificationOtpDB, EmailVerificationTokenDB
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)


def execute(user_id: str, user_email: str, user_name: str, db: Session) -> None:
    """
    Create a verification link token + a 6-digit OTP, store both in DB, send one email.

    User can verify either by:
      - Clicking the link  → GET /api/v1/auth/verify-email?token=...
      - Entering the code  → POST /api/v1/auth/verify-email-code

    Does not raise on email send failure (user is already created).
    """
    now = datetime.now(timezone.utc)

    # --- Link token ---
    raw_token = secrets.token_urlsafe(32)
    link_expires_at = now + timedelta(hours=config.EMAIL_VERIFICATION_EXPIRY_HOURS)

    token_record = EmailVerificationTokenDB(
        user_id=user_id,
        token_hash=_hash(raw_token),
        expires_at=link_expires_at,
    )
    db.add(token_record)

    # --- OTP code ---
    raw_otp = _generate_otp()
    otp_expires_at = now + timedelta(minutes=config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES)

    otp_record = EmailVerificationOtpDB(
        user_id=user_id,
        otp_hash=_hash(raw_otp),
        expires_at=otp_expires_at,
    )
    db.add(otp_record)

    # --- Send email with both ---
    verification_link = f"{config.EMAIL_VERIFICATION_LINK_BASE}?token={raw_token}"

    subject, html_body, text_body = load_email_template(
        "welcome_verification",
        context={
            "user_name": user_name,
            "verification_link": verification_link,
            "expiry_hours": config.EMAIL_VERIFICATION_EXPIRY_HOURS,
            "otp_code": raw_otp,
            "otp_expiry_minutes": config.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES,
        },
    )

    send_email(to_email=user_email, subject=subject, html_body=html_body, text_body=text_body)
