"""Logout use case - revoke refresh token to invalidate session."""

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import RefreshTokenDB


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def execute(refresh_token: str, db: Session) -> dict:
    """
    Revoke refresh token (logout).

    Marks the refresh token as revoked so it can no longer be used.
    Client should discard stored tokens after logout.
    """
    token_hash = _hash_token(refresh_token)
    now = datetime.now(timezone.utc)

    token_record = (
        db.query(RefreshTokenDB)
        .filter(
            RefreshTokenDB.token_hash == token_hash,
            RefreshTokenDB.revoked_at.is_(None),
        )
        .first()
    )

    if not token_record:
        # Token already revoked or invalid - treat as success (idempotent logout)
        return {"message": "Logged out successfully."}

    token_record.revoked_at = now
    token_record.updated_at = now
    db.commit()

    return {"message": "Logged out successfully."}
