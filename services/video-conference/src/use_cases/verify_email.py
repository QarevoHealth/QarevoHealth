"""Verify email - validate token, mark used, update user."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.models import (
    AttemptType,
    EmailVerificationTokenDB,
    TokenType,
    UserDB,
    UserTokenAttemptDB,
    UserTokenLockoutDB,
)
from src.use_cases.resend_verification_email import _create_lockout, _count_attempts


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


<<<<<<< HEAD
def _record_failed_attempt(db: Session, user_id, token_type: str, attempt_type: str) -> None:
    """Record failed verification attempt (counts toward 3-attempt limit)."""
    attempt = UserTokenAttemptDB(
        user_id=user_id,
        token_type=token_type,
        attempt_type=attempt_type,
    )
    db.add(attempt)


def _check_lockout(db: Session, user_id) -> bool:
    """Return True if user is locked."""
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


def execute(token: str, db: Session) -> dict:
    """
    Verify email token. Mark token used, set user email_verified=True, status=ACTIVE.

    Records failed attempts (expired/used token) in user_token_attempts.
    Checks lockout before processing.
=======
def execute(token: str, db: Session) -> dict:
    """
    Verify email token. Mark token used, set user email_verified=True, status=ACTIVE.
    Returns {"message": "Email verified successfully."}
>>>>>>> 4f66cfc247587ed5d144d45bec932e416100fc5c
    """
    token_hash = _hash_token(token)
    now = datetime.now(timezone.utc)

<<<<<<< HEAD
    # Find token by hash (any - used, invalidated, or valid)
    token_record = (
        db.query(EmailVerificationTokenDB)
        .filter(EmailVerificationTokenDB.token_hash == token_hash)
        .first()
    )

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

=======
    token_record = (
        db.query(EmailVerificationTokenDB)
        .filter(
            EmailVerificationTokenDB.token_hash == token_hash,
            EmailVerificationTokenDB.used_at.is_(None),
        )
        .first()
    )
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    if token_record.expires_at < now:
        raise HTTPException(status_code=400, detail="Verification link has expired")

>>>>>>> 4f66cfc247587ed5d144d45bec932e416100fc5c
    user = db.query(UserDB).filter(UserDB.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

<<<<<<< HEAD
    # Check lockout
    if _check_lockout(db, user.id):
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please try again later.",
        )

    # Token invalidated (superseded by resend)
    if token_record.invalidated_at is not None:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has been replaced. Please use the latest link.")

    # Token already used (successfully verified)
    if token_record.used_at is not None:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has already been used")

    # Token expired
    if token_record.expires_at < now:
        _record_failed_attempt(db, user.id, TokenType.EMAIL_VERIFICATION, AttemptType.VERIFY_FAIL)
        attempts = _count_attempts(db, user.id, TokenType.EMAIL_VERIFICATION)
        if attempts >= config.RESEND_ATTEMPTS_LIMIT:
            _create_lockout(db, user.id, TokenType.EMAIL_VERIFICATION)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has expired")

    # Valid token - proceed
=======
    # Update in memory (session tracks changes)
>>>>>>> 4f66cfc247587ed5d144d45bec932e416100fc5c
    token_record.used_at = now
    user.email_verified = True
    user.status = CONFIG_USER.STATUS.ACTIVE

<<<<<<< HEAD
=======
    # Persist to DB
>>>>>>> 4f66cfc247587ed5d144d45bec932e416100fc5c
    db.commit()
    return {"message": "Email verified successfully."}
