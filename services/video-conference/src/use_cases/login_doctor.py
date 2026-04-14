"""Doctor login use case — username + password, email must be verified."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.failure_reasons import FailureReason
from src.constants.user import CONFIG_USER
from src.models import AuditEventCategory, AuditEventType, RefreshTokenDB, UserDB
from src.models.provider import ProviderDB
from src.schemas.doctor import DoctorLoginRequest
from src.services.audit_service import write_audit_log
from src.services.auth_service import (
    create_access_token,
    create_refresh_token,
    verify_password,
)


def execute(
    request: DoctorLoginRequest,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Doctor login: verify username + password, check email_verified, return tokens.
    Phone verification is NOT required.
    """
    user = (
        db.query(UserDB)
        .join(ProviderDB, ProviderDB.user_id == UserDB.id)
        .filter(ProviderDB.username == request.username)
        .first()
    )

    if not user or not user.password_hash:
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.USER_NOT_FOUND,
            extra_data={"username": request.username},
            commit=True,
        )
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(request.password, user.password_hash):
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.INVALID_PASSWORD,
            commit=True,
        )
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.email_verified:
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.EMAIL_NOT_VERIFIED,
            commit=True,
        )
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox for the verification link.",
        )

    if user.status != CONFIG_USER.STATUS.ACTIVE:
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.ACCOUNT_NOT_ACTIVE,
            commit=True,
        )
        raise HTTPException(status_code=403, detail="Account not active.")

    access_token = create_access_token(user.id, user.email, user.role)
    raw_refresh, token_hash = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(RefreshTokenDB(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    ))

    write_audit_log(
        db,
        event_type=AuditEventType.LOGIN_SUCCESS,
        event_category=AuditEventCategory.AUTH,
        success=True,
        actor_user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
