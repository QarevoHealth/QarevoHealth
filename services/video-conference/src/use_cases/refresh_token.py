"""Refresh token use case - access token renewal with refresh token rotation.

Implements:
- Access token renewal: exchange refresh token for new access + refresh tokens
- Refresh token rotation: old token invalidated, new one issued (improved security)
- Token reuse detection: if already-used token is submitted, revoke all user tokens (theft detection)
"""

import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.models import RefreshTokenDB, UserDB
from src.services.auth_service import create_access_token, create_refresh_token


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _revoke_all_user_tokens(db: Session, user_id, now: datetime) -> None:
    """Revoke all refresh tokens for a user (used on token reuse detection)."""
    db.query(RefreshTokenDB).filter(
        RefreshTokenDB.user_id == user_id,
        RefreshTokenDB.revoked_at.is_(None),
    ).update(
        {RefreshTokenDB.revoked_at: now, RefreshTokenDB.updated_at: now},
        synchronize_session=False,
    )


def execute(
    refresh_token: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Validate refresh token, mark as used, create new access + refresh tokens.
    Returns access_token, refresh_token, expires_in.
    """
    token_hash = _hash_token(refresh_token)
    now = datetime.now(timezone.utc)

    # Find token (any state - we need to detect reuse)
    token_record = db.query(RefreshTokenDB).filter(RefreshTokenDB.token_hash == token_hash).first()

    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user = db.query(UserDB).filter(UserDB.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Token reuse detection: already used = possible theft, revoke all user tokens
    if token_record.is_used or token_record.revoked_at:
        _revoke_all_user_tokens(db, token_record.user_id, now)
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Refresh token was already used. Session invalidated for security. Please log in again.",
        )

    if token_record.expires_at < now:
        raise HTTPException(status_code=401, detail="Refresh token has expired")

    # Rotation: mark old token as used
    token_record.is_used = True
    token_record.revoked_at = now
    token_record.updated_at = now

    # Create new tokens (access renewal + refresh rotation)
    access_token = create_access_token(user.id, user.email, user.role)
    raw_refresh, new_token_hash = create_refresh_token()
    expires_at = now + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

    # Store new refresh token
    new_refresh = RefreshTokenDB(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(new_refresh)
    db.commit()

    expires_in_seconds = config.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": expires_in_seconds,
    }
