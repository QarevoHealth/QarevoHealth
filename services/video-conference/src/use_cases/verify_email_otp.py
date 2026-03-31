"""Verify email via OTP code - alternative to link-based verification."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.failure_reasons import FailureReason
from src.constants.user import CONFIG_USER
from src.models import (
    AuditEventCategory,
    AuditEventType,
    AttemptType,
    EmailVerificationOtpDB,
    EmailVerificationTokenDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
    UserTokenLockoutDB,
)
from src.services.audit_service import write_audit_log


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _check_lockout(db: Session, user_id) -> bool:
    now = datetime.now(timezone.utc)
    return (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == TokenType.OTP_EMAIL_VERIFICATION,
            UserTokenLockoutDB.locked_until > now,
        )
        .first()
        is not None
    )


def _record_failed_attempt(db: Session, user_id) -> None:
    db.add(UserTokenAttemptDB(
        user_id=user_id,
        token_type=TokenType.OTP_EMAIL_VERIFICATION,
        attempt_type=AttemptType.OTP_VERIFY_FAIL,
    ))


def _count_recent_failures(db: Session, user_id) -> int:
    from datetime import timedelta
    from src.config import config
    window_start = datetime.now(timezone.utc) - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)
    return (
        db.query(UserTokenAttemptDB)
        .filter(
            UserTokenAttemptDB.user_id == user_id,
            UserTokenAttemptDB.token_type == TokenType.OTP_EMAIL_VERIFICATION,
            UserTokenAttemptDB.attempted_at >= window_start,
        )
        .count()
    )


def _create_lockout(db: Session, user_id) -> None:
    from datetime import timedelta
    from src.config import config
    now = datetime.now(timezone.utc)
    locked_until = now + timedelta(hours=config.LOCKOUT_HOURS)
    existing = (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == TokenType.OTP_EMAIL_VERIFICATION,
        )
        .first()
    )
    if existing:
        existing.locked_until = locked_until
        existing.created_at = now
    else:
        db.add(UserTokenLockoutDB(
            user_id=user_id,
            token_type=TokenType.OTP_EMAIL_VERIFICATION,
            locked_until=locked_until,
        ))


def execute(
    email: str,
    code: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Verify email using the 6-digit OTP code.

    Flow:
    1. Find user by email — must be PENDING_VERIFICATION
    2. Check OTP lockout
    3. Find the latest active (non-used, non-invalidated) OTP
    4. Validate: not expired, not used, not invalidated
    5. Compare submitted code hash with stored hash
    6. On success: mark OTP used, invalidate any pending link tokens, activate user
    """
    email_lower = email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.status != CONFIG_USER.STATUS.PENDING_VERIFICATION:
        raise HTTPException(status_code=400, detail="Email already verified or account not pending verification.")

    if _check_lockout(db, user.id):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again later.")

    now = datetime.now(timezone.utc)

    # Find latest OTP for this user (most recently created)
    otp_record = (
        db.query(EmailVerificationOtpDB)
        .filter(EmailVerificationOtpDB.user_id == user.id)
        .order_by(EmailVerificationOtpDB.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="No verification code found. Please request a new one.")

    if otp_record.invalidated_at is not None:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(db, AuditEventType.EMAIL_VERIFICATION_FAILED, AuditEventCategory.AUTH,
                        success=False, actor_user_id=user.id, ip_address=ip_address,
                        user_agent=user_agent, failure_reason=FailureReason.OTP_INVALIDATED)
        db.commit()
        raise HTTPException(status_code=400, detail="This code has been replaced. Please request a new code.")

    if otp_record.used_at is not None:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(db, AuditEventType.EMAIL_VERIFICATION_FAILED, AuditEventCategory.AUTH,
                        success=False, actor_user_id=user.id, ip_address=ip_address,
                        user_agent=user_agent, failure_reason=FailureReason.OTP_ALREADY_USED)
        db.commit()
        raise HTTPException(status_code=400, detail="This code has already been used.")

    if otp_record.expires_at < now:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(db, AuditEventType.EMAIL_VERIFICATION_FAILED, AuditEventCategory.AUTH,
                        success=False, actor_user_id=user.id, ip_address=ip_address,
                        user_agent=user_agent, failure_reason=FailureReason.OTP_EXPIRED)
        db.commit()
        raise HTTPException(status_code=400, detail="This code has expired. Please request a new one.")

    if _hash(code) != otp_record.otp_hash:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(db, AuditEventType.EMAIL_VERIFICATION_FAILED, AuditEventCategory.AUTH,
                        success=False, actor_user_id=user.id, ip_address=ip_address,
                        user_agent=user_agent, failure_reason=FailureReason.OTP_CODE_MISMATCH)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Valid — activate user
    otp_record.used_at = now
    user.email_verified = True
    user.status = CONFIG_USER.STATUS.ACTIVE

    # Invalidate any pending link tokens (email is verified, links no longer needed)
    db.query(EmailVerificationTokenDB).filter(
        EmailVerificationTokenDB.user_id == user.id,
        EmailVerificationTokenDB.used_at.is_(None),
        EmailVerificationTokenDB.invalidated_at.is_(None),
    ).update({EmailVerificationTokenDB.invalidated_at: now}, synchronize_session=False)

    write_audit_log(db, AuditEventType.EMAIL_VERIFIED, AuditEventCategory.AUTH,
                    success=True, actor_user_id=user.id, ip_address=ip_address,
                    user_agent=user_agent)

    db.commit()
    return {"message": "Email verified successfully."}


def _maybe_lockout(db: Session, user_id) -> None:
    """Lock the user if they've hit the failure limit."""
    from src.config import config
    failures = _count_recent_failures(db, user_id)
    if failures >= config.RESEND_ATTEMPTS_LIMIT:
        _create_lockout(db, user_id)
