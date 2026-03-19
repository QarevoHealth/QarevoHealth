"""Reset password with token from email link."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import PasswordResetTokenDB, UserDB, UserTokenAttemptDB
from src.models.token_constants import AttemptType, TokenType


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def execute(token: str, new_password: str, db: Session) -> dict:
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
        # Record failed attempt if we can find user by... we can't easily. Skip for invalid token.
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user_id = token_record.user_id

    # Already used
    if token_record.used_at:
        _record_failed_attempt(db, user_id)
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has already been used")

    # Invalidated (superseded by resend)
    if token_record.invalidated_at:
        _record_failed_attempt(db, user_id)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    # Expired
    if token_record.expires_at < now:
        _record_failed_attempt(db, user_id)
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    # Valid - update password
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    from src.services.auth_service import hash_password

    user.password_hash = hash_password(new_password)
    user.updated_at = now
    token_record.used_at = now
    db.commit()

    return {"message": "Password has been reset successfully."}


def _record_failed_attempt(db: Session, user_id) -> None:
    """Record failed reset attempt for lockout counting."""
    attempt = UserTokenAttemptDB(
        user_id=user_id,
        token_type=TokenType.PASSWORD_RESET,
        attempt_type=AttemptType.RESET_FAIL,
    )
    db.add(attempt)
