"""Verify email - validate token, mark used, update user."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.models import EmailVerificationTokenDB, UserDB


def _hash_token(token: str) -> str:
    """SHA-256 hash of token for lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def execute(token: str, db: Session) -> dict:
    """
    Verify email token. Mark token used, set user email_verified=True, status=ACTIVE.
    Returns {"message": "Email verified successfully."}
    """
    token_hash = _hash_token(token)
    now = datetime.now(timezone.utc)

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

    user = db.query(UserDB).filter(UserDB.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update in memory (session tracks changes)
    token_record.used_at = now
    user.email_verified = True
    user.status = CONFIG_USER.STATUS.ACTIVE

    # Persist to DB
    db.commit()
    return {"message": "Email verified successfully."}
