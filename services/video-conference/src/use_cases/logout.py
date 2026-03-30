"""Logout use case - revoke refresh token to invalidate session."""

import hashlib
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.models import AuditEventCategory, AuditEventType, RefreshTokenDB
from src.services.audit_service import write_audit_log


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def execute(
    refresh_token: str,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
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
        # Already revoked or invalid — idempotent, no audit needed
        return {"message": "Logged out successfully."}

    token_record.revoked_at = now
    token_record.updated_at = now

    write_audit_log(
        db,
        event_type=AuditEventType.LOGOUT,
        event_category=AuditEventCategory.AUTH,
        success=True,
        actor_user_id=token_record.user_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()

    return {"message": "Logged out successfully."}
