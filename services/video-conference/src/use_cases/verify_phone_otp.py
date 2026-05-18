"""Verify provider phone via 6-digit SMS OTP (after email is verified)."""

import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.failure_reasons import FailureReason
from src.constants.user import CONFIG_USER
from src.models import (
    AuditEventCategory,
    AuditEventType,
    AttemptType,
    PhoneVerificationOtpDB,
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
            UserTokenLockoutDB.token_type == TokenType.OTP_PHONE_VERIFICATION,
            UserTokenLockoutDB.locked_until > now,
        )
        .first()
        is not None
    )


def _record_failed_attempt(db: Session, user_id) -> None:
    db.add(
        UserTokenAttemptDB(
            user_id=user_id,
            token_type=TokenType.OTP_PHONE_VERIFICATION,
            attempt_type=AttemptType.OTP_VERIFY_FAIL,
        )
    )


def _count_recent_failures(db: Session, user_id) -> int:
    from src.config import config

    window_start = datetime.now(timezone.utc) - timedelta(hours=config.RESEND_ATTEMPTS_WINDOW_HOURS)
    return (
        db.query(UserTokenAttemptDB)
        .filter(
            UserTokenAttemptDB.user_id == user_id,
            UserTokenAttemptDB.token_type == TokenType.OTP_PHONE_VERIFICATION,
            UserTokenAttemptDB.attempted_at >= window_start,
        )
        .count()
    )


def _create_lockout(db: Session, user_id) -> None:
    from src.config import config

    now = datetime.now(timezone.utc)
    locked_until = now + timedelta(hours=config.LOCKOUT_HOURS)
    existing = (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == TokenType.OTP_PHONE_VERIFICATION,
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
                token_type=TokenType.OTP_PHONE_VERIFICATION,
                locked_until=locked_until,
            )
        )


def _maybe_lockout(db: Session, user_id) -> None:
    from src.config import config

    failures = _count_recent_failures(db, user_id)
    if failures >= config.RESEND_ATTEMPTS_LIMIT:
        _create_lockout(db, user_id)


def execute(
    country_code: str,
    phone: str,
    code: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    cc = country_code.strip()
    phone_digits = "".join(ch for ch in phone if ch.isdigit())
    user = db.query(UserDB).filter(
        UserDB.country_code == cc,
        UserDB.phone == phone_digits,
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=400, detail="Phone verification is only for provider accounts.")

    if not user.email_verified:
        raise HTTPException(status_code=400, detail="Verify your email before verifying your phone.")

    if user.phone_verified:
        raise HTTPException(status_code=400, detail="Phone already verified.")

    if user.status != CONFIG_USER.STATUS.PENDING_VERIFICATION:
        raise HTTPException(status_code=400, detail="Account is not awaiting phone verification.")

    if _check_lockout(db, user.id):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again later.")

    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(PhoneVerificationOtpDB)
        .filter(PhoneVerificationOtpDB.user_id == user.id)
        .order_by(PhoneVerificationOtpDB.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="No verification code found. Please request a new one.")

    if otp_record.invalidated_at is not None:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(
            db,
            AuditEventType.PHONE_VERIFICATION_FAILED,
            AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.OTP_INVALIDATED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="This code has been replaced. Please request a new code.")

    if otp_record.used_at is not None:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(
            db,
            AuditEventType.PHONE_VERIFICATION_FAILED,
            AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.OTP_ALREADY_USED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="This code has already been used.")

    if otp_record.expires_at < now:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(
            db,
            AuditEventType.PHONE_VERIFICATION_FAILED,
            AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.OTP_EXPIRED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="This code has expired. Please request a new one.")

    if _hash(code) != otp_record.otp_hash:
        _record_failed_attempt(db, user.id)
        _maybe_lockout(db, user.id)
        write_audit_log(
            db,
            AuditEventType.PHONE_VERIFICATION_FAILED,
            AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.OTP_CODE_MISMATCH,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    otp_record.used_at = now
    user.phone_verified = True
    user.status = CONFIG_USER.STATUS.ACTIVE

    write_audit_log(
        db,
        AuditEventType.PHONE_VERIFIED,
        AuditEventCategory.AUTH,
        success=True,
        actor_user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()
    return {"message": "Phone verified successfully. You can log in now."}
