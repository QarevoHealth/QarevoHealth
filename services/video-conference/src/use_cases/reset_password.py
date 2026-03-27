"""Reset password with token from email link."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.failure_reasons import FailureReason
from src.models import AuditEventCategory, AuditEventType, PasswordResetTokenDB, UserDB, UserTokenAttemptDB
from src.models.token_constants import AttemptType, TokenType
from src.services.audit_service import write_audit_log


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def execute(
    token: str,
    new_password: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Reset password using token from email link.

    Validates: token exists, not expired, not used, not invalidated.
    Records failed attempts (expired/used/invalid token) in user_token_attempts.
    """
    now = datetime.now(timezone.utc)
    token_hash = _hash_token(token)

    token_record = (
        db.query(PasswordResetTokenDB)
        .filter(PasswordResetTokenDB.token_hash == token_hash)
        .first()
    )

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user_id = token_record.user_id

    if token_record.used_at:
        _record_failed_attempt(db, user_id)
        write_audit_log(
            db,
            event_type=AuditEventType.PASSWORD_RESET_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.RESET_TOKEN_ALREADY_USED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has already been used")

    if token_record.invalidated_at:
        _record_failed_attempt(db, user_id)
        write_audit_log(
            db,
            event_type=AuditEventType.PASSWORD_RESET_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.RESET_TOKEN_INVALIDATED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if token_record.expires_at < now:
        _record_failed_attempt(db, user_id)
        write_audit_log(
            db,
            event_type=AuditEventType.PASSWORD_RESET_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.RESET_TOKEN_EXPIRED,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    from src.services.auth_service import hash_password

    user.password_hash = hash_password(new_password)
    user.updated_at = now
    token_record.used_at = now

    write_audit_log(
        db,
        event_type=AuditEventType.PASSWORD_RESET_SUCCESS,
        event_category=AuditEventCategory.AUTH,
        success=True,
        actor_user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()

    return {"message": "Password has been reset successfully."}


def _record_failed_attempt(db: Session, user_id) -> None:
    attempt = UserTokenAttemptDB(
        user_id=user_id,
        token_type=TokenType.PASSWORD_RESET,
        attempt_type=AttemptType.RESET_FAIL,
    )
    db.add(attempt)
