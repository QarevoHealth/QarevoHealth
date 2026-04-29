"""Shared helpers for token attempt counting and lockout handling."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models import UserTokenAttemptDB, UserTokenLockoutDB


def get_active_lockout(db: Session, user_id, token_type: str) -> UserTokenLockoutDB | None:
    now = datetime.now(timezone.utc)
    return (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == token_type,
            UserTokenLockoutDB.locked_until > now,
        )
        .first()
    )


def create_or_extend_lockout(
    db: Session,
    user_id,
    token_type: str,
    lockout_hours: int,
) -> None:
    now = datetime.now(timezone.utc)
    locked_until = now + timedelta(hours=lockout_hours)
    existing = (
        db.query(UserTokenLockoutDB)
        .filter(
            UserTokenLockoutDB.user_id == user_id,
            UserTokenLockoutDB.token_type == token_type,
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
                token_type=token_type,
                locked_until=locked_until,
            )
        )


def count_attempts_with_created_tokens(
    db: Session,
    user_id,
    token_type: str,
    window_hours: int,
    token_model,
) -> int:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=window_hours)

    created_count = (
        db.query(func.count(token_model.id))
        .filter(
            token_model.user_id == user_id,
            token_model.created_at >= window_start,
        )
        .scalar()
        or 0
    )

    failed_count = (
        db.query(func.count(UserTokenAttemptDB.id))
        .filter(
            UserTokenAttemptDB.user_id == user_id,
            UserTokenAttemptDB.token_type == token_type,
            UserTokenAttemptDB.attempted_at >= window_start,
        )
        .scalar()
        or 0
    )

    return created_count + failed_count


def build_lockout_payload(
    locked_until: datetime,
    error_code: str,
    message: str,
    lockout_hours: int,
    attempts_limit: int,
) -> dict:
    now = datetime.now(timezone.utc)
    retry_after_seconds = max(0, int((locked_until - now).total_seconds()))
    return {
        "error_code": error_code,
        "message": message,
        "locked_until": locked_until.isoformat(),
        "retry_after_seconds": retry_after_seconds,
        "lock_duration_seconds": lockout_hours * 3600,
        "attempts_limit": attempts_limit,
    }


def raise_lockout_http_exception(payload: dict) -> None:
    raise HTTPException(
        status_code=429,
        detail=payload,
        headers={"Retry-After": str(payload["retry_after_seconds"])},
    )
