"""Verify email - validate token, mark used, update user."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.constants.failure_reasons import FailureReason
from src.models import (
    AuditEventCategory,
    AuditEventType,
    AttemptType,
    EmailVerificationTokenDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
    UserTokenLockoutDB,
)
from src.services.audit_service import write_audit_log
from src.use_cases.resend_verification_email import _create_lockout, _count_attempts


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _record_failed_attempt(db: Session, user_id, token_type: str, attempt_type: str) -> None:
    attempt = UserTokenAttemptDB(
        user_id=user_id,
        token_type=token_type,
        attempt_type=attempt_type,
    )
    db.add(attempt)


def _check_lockout(db: Session, user_id) -> bool:
    now = datetime.now(timezone.utc)
    return (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == TokenType.EMAIL_VERIFICATION,
            UserTokenLockoutDB.locked_until > now,
        )
        .first()
        is not None
    )


def execute(
    token: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Verify email token. Mark token used, set user email_verified=True, status=ACTIVE.

    Records failed attempts (expired/used token) in user_token_attempts.
    Checks lockout before processing.
    """
    token_hash = _hash_token(token)
    now = datetime.now(timezone.utc)

    token_record = (
        db.query(EmailVerificationTokenDB)
        .filter(EmailVerificationTokenDB.token_hash == token_hash)
        .first()
    )

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user = db.query(UserDB).filter(UserDB.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if _check_lockout(db, user.id):
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")

    if token_record.invalidated_at is not None:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        write_audit_log(
            db,
            event_type=AuditEventType.EMAIL_VERIFICATION_FAILED,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.EMAIL_VERIFICATION_TOKEN_INVALIDATED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has been replaced. Please use the latest link.")

    if token_record.used_at is not None:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        write_audit_log(
            db,
            event_type=AuditEventType.EMAIL_VERIFICATION_FAILED,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.EMAIL_VERIFICATION_TOKEN_ALREADY_USED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has already been used")

    if token_record.expires_at < now:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        write_audit_log(
            db,
            event_type=AuditEventType.EMAIL_VERIFICATION_FAILED,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.EMAIL_VERIFICATION_TOKEN_EXPIRED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has expired")

    token_record.used_at = now
    user.email_verified = True

    if user.role == CONFIG_USER.ROLE.PROVIDER:
        msg = (
            "Email verified successfully. Enter the SMS code sent to your phone to finish setup."
        )
    else:
        user.status = CONFIG_USER.STATUS.ACTIVE
        msg = "Email verified successfully."

    write_audit_log(
        db,
        event_type=AuditEventType.EMAIL_VERIFIED,
        event_category=AuditEventCategory.AUTH,
        success=True,
        actor_user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()
    return {"message": msg}
