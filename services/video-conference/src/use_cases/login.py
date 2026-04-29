"""Patient login use case - verify credentials and issue tokens."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.config import config
from src.constants.user import CONFIG_USER
from src.constants.failure_reasons import FailureReason
from src.models import AuditEventCategory, AuditEventType, RefreshTokenDB, UserDB
from src.schemas.auth import LoginRequest
from src.services.audit_service import write_audit_log
from src.services.auth_service import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from src.use_cases.send_verification_email import execute as send_verification_email


def execute(
    request: LoginRequest,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """
    Patient login: verify email+password, create access + refresh tokens, store refresh token in DB.
    Returns access_token, refresh_token, expires_in.
    """
    email_lower = request.email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()

    if not user or not user.password_hash:
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.USER_NOT_FOUND,
            extra_data={"email": email_lower},
            commit=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

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
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role != CONFIG_USER.ROLE.PATIENT:
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
        raise HTTPException(
            status_code=403,
            detail="Use doctor login endpoint for provider accounts.",
        )

    if user.status == CONFIG_USER.STATUS.PENDING_VERIFICATION:
        send_verification_email(
            user_id=user.id,
            user_email=(user.email or "").lower().strip(),
            user_name=user.first_name,
            db=db,
        )
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
            detail={"error_code": "EMAIL_VERIFICATION_PENDING"},
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
        raise HTTPException(
            status_code=403,
            detail={"error_code": "ACCOUNT_NOT_ACTIVE"},
        )

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
            detail={"error_code": "EMAIL_VERIFICATION_PENDING"},
        )

    access_token = create_access_token(user.id, user.email, user.role)
    raw_refresh, token_hash = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_record = RefreshTokenDB(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(refresh_record)

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

    expires_in_seconds = config.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": expires_in_seconds,
        "email_verified": bool(user.email_verified),
        "phone_verified": bool(user.phone_verified),
    }
