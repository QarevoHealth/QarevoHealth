"""Doctor login use case with email + phone 2FA enforcement."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.config import config
from src.constants.failure_reasons import FailureReason
from src.constants.user import CONFIG_USER
from src.models import AuditEventCategory, AuditEventType, RefreshTokenDB, UserDB
from src.schemas.auth import DoctorLoginRequest
from src.services.audit_service import write_audit_log
from src.services.auth_service import create_access_token, create_refresh_token, verify_password
from src.use_cases.send_verification_email import execute as send_verification_email
from src.use_cases.send_verification_sms import execute as send_verification_sms


def execute(
    request: DoctorLoginRequest,
    db: Session,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    identifier = request.identifier.strip()
    identifier_lower = identifier.lower()
    identifier_digits = "".join(ch for ch in identifier if ch.isdigit())

    user = (
        db.query(UserDB)
        .filter(
            or_(
                UserDB.email.ilike(identifier_lower),
                UserDB.phone == identifier,
                UserDB.phone == identifier_digits,
            )
        )
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
            extra_data={"identifier": identifier},
            commit=True,
        )
        raise HTTPException(status_code=401, detail="Invalid identifier or password")

    if user.role != CONFIG_USER.ROLE.PROVIDER:
        raise HTTPException(status_code=403, detail="Use patient login endpoint for patient accounts.")

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
        raise HTTPException(status_code=401, detail="Invalid identifier or password")

    if user.status == CONFIG_USER.STATUS.PENDING_VERIFICATION:
        # Pending doctor: if email not verified, send only email verification.
        if not user.email_verified:
            send_verification_email(
                user_id=user.id,
                user_email=(user.email or "").lower().strip(),
                user_name=user.first_name,
                db=db,
            )
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Email verification code sent. Please verify your email first.",
            )

        # Pending doctor: email verified but phone not verified -> send phone OTP via SMS.
        if user.email_verified and not user.phone_verified:
            send_verification_sms(
                user_id=user.id,
                country_code=user.country_code or "",
                phone=user.phone or "",
                db=db,
            )
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Phone not verified yet. Please complete phone verification.",
            )

        # Pending doctor: if both already verified, trigger login-time 2FA challenge.
        if user.email_verified and user.phone_verified:
            send_verification_email(
                user_id=user.id,
                user_email=(user.email or "").lower().strip(),
                user_name=user.first_name,
                db=db,
            )
            send_verification_sms(
                user_id=user.id,
                country_code=user.country_code or "",
                phone=user.phone or "",
                db=db,
            )
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Login 2FA codes sent to your email and phone. Please verify.",
            )

    # Active doctor + both verified -> trigger login-time 2FA challenge.
    if (
        user.status == CONFIG_USER.STATUS.ACTIVE
        and user.email_verified
        and user.phone_verified
    ):
        send_verification_email(
            user_id=user.id,
            user_email=(user.email or "").lower().strip(),
            user_name=user.first_name,
            db=db,
        )
        send_verification_sms(
            user_id=user.id,
            country_code=user.country_code or "",
            phone=user.phone or "",
            db=db,
        )
        db.commit()
        raise HTTPException(
            status_code=403,
            detail="Login 2FA codes sent to your email and phone. Please verify.",
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
        raise HTTPException(status_code=403, detail="Email not verified. Complete email verification first.")

    if not user.phone_verified:
        write_audit_log(
            db,
            event_type=AuditEventType.LOGIN_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            actor_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=FailureReason.PHONE_NOT_VERIFIED,
            commit=True,
        )
        raise HTTPException(status_code=403, detail="Phone not verified.")

    access_token = create_access_token(user.id, user.email, user.role)
    raw_refresh, token_hash = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(
        RefreshTokenDB(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

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
        "email_verified": bool(user.email_verified),
        "phone_verified": bool(user.phone_verified),
    }
