"""Request password reset - sends email with link. Always returns success for security."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.models import (
    AuditEventCategory,
    AuditEventType,
    PasswordResetTokenDB,
    TokenType,
    UserDB,
)
from src.services.audit_service import write_audit_log
from src.services.email_service import send_email
from src.services.notification_loader import load_email_template
from src.use_cases.token_lockout import (
    count_attempts_with_created_tokens,
    create_or_extend_lockout,
    get_active_lockout,
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _check_lockout(db: Session, user_id):
    return get_active_lockout(db, user_id, TokenType.PASSWORD_RESET)


def _count_attempts(db: Session, user_id) -> int:
    return count_attempts_with_created_tokens(
        db=db,
        user_id=user_id,
        token_type=TokenType.PASSWORD_RESET,
        window_hours=config.RESEND_ATTEMPTS_WINDOW_HOURS,
        token_model=PasswordResetTokenDB,
    )


def _create_lockout(db: Session, user_id) -> None:
    create_or_extend_lockout(db, user_id, TokenType.PASSWORD_RESET, config.LOCKOUT_HOURS)


def _build_lockout_payload(locked_until: datetime) -> dict:
    now = datetime.now(timezone.utc)
    retry_after_seconds = max(0, int((locked_until - now).total_seconds()))
    return {
        "error_code": "PASSWORD_RESET_LOCKED",
        "message": "Too many attempts. Try again later.",
        "locked_until": locked_until.isoformat(),
        "retry_after_seconds": retry_after_seconds,
        "lock_duration_seconds": config.LOCKOUT_HOURS * 3600,
        "attempts_limit": config.RESEND_ATTEMPTS_LIMIT,
    }


def execute(
    email: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Request password reset - sends email with link if user exists.

    Returns success for unknown email (do not reveal account existence).
    Returns 429 with lockout metadata when known account is rate limited.
    If user exists: create token, invalidate old tokens, send email.
    If user does not exist: return success without sending.
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if not user:
        return {"message": "If an account exists with this email, a password reset link has been sent."}

    lockout = _check_lockout(db, user.id)
    if lockout:
        payload = _build_lockout_payload(lockout.locked_until)
        raise HTTPException(
            status_code=429,
            detail=payload,
            headers={"Retry-After": str(payload["retry_after_seconds"])},
        )

    attempts = _count_attempts(db, user.id)
    if attempts >= config.RESEND_ATTEMPTS_LIMIT:
        locked_until = datetime.now(timezone.utc) + timedelta(hours=config.LOCKOUT_HOURS)
        _create_lockout(db, user.id)
        db.commit()
        payload = _build_lockout_payload(locked_until)
        raise HTTPException(
            status_code=429,
            detail=payload,
            headers={"Retry-After": str(payload["retry_after_seconds"])},
        )

    now = datetime.now(timezone.utc)

    # Invalidate any existing unused tokens
    db.query(PasswordResetTokenDB).filter(
        PasswordResetTokenDB.user_id == user.id,
        PasswordResetTokenDB.used_at.is_(None),
        PasswordResetTokenDB.invalidated_at.is_(None),
    ).update({PasswordResetTokenDB.invalidated_at: now}, synchronize_session=False)

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

    write_audit_log(
        db,
        event_type=AuditEventType.PASSWORD_RESET_REQUEST,
        event_category=AuditEventCategory.AUTH,
        success=True,
        actor_user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()

    return {"message": "If an account exists with this email, a password reset link has been sent."}
