"""Register user use case - creates user, patient, and consents."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.constants.failure_reasons import FailureReason
from src.models import AuditEventCategory, AuditEventType, ConsentType, PatientDB, UserConsentDB, UserDB
from src.services.audit_service import write_audit_log
from src.use_cases.send_verification_email import execute as send_verification_email
from src.schemas.auth import RegisterRequest
from src.services.auth_service import hash_password


def execute(request: RegisterRequest, db: Session, ip_address: str | None = None):
    """Register a new user (patient) with consents."""
    email_lower = request.email.lower().strip()
    existing = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if existing:
        write_audit_log(
            db,
            event_type=AuditEventType.REGISTER_FAILURE,
            event_category=AuditEventCategory.AUTH,
            success=False,
            ip_address=ip_address,
            failure_reason=FailureReason.EMAIL_ALREADY_REGISTERED,
            extra_data={"email": email_lower},
            commit=True,
        )
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant_id = None

    try:
        user = UserDB(
            first_name=request.first_name,
            middle_name=request.middle_name,
            last_name=request.last_name,
            tenant_id=tenant_id,
            role=CONFIG_USER.ROLE.PATIENT,
            email=email_lower,
            country_code=request.country_code.strip(),
            phone=request.phone.strip(),
            password_hash=hash_password(request.password),
            status=CONFIG_USER.STATUS.PENDING_VERIFICATION,
            email_verified=False,
        )
        db.add(user)
        db.flush()

        patient = PatientDB(
            user_id=user.id,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
        )
        db.add(patient)

        now = datetime.now(timezone.utc)
        consent_map = {
            ConsentType.TERMS_PRIVACY: request.consents.terms_privacy,
            ConsentType.TELEHEALTH: request.consents.telehealth,
            ConsentType.MARKETING: request.consents.marketing,
        }
        consent_records = [
            UserConsentDB(
                user_id=user.id,
                consent_type=consent_type,
                accepted=accepted,
                accepted_at=now if accepted else None,
                ip_address=ip_address,
            )
            for consent_type, accepted in consent_map.items()
        ]
        db.add_all(consent_records)

        send_verification_email(
            user_id=user.id,
            user_email=email_lower,
            user_name=request.first_name,
            db=db,
        )

        write_audit_log(
            db,
            event_type=AuditEventType.REGISTER,
            event_category=AuditEventCategory.AUTH,
            success=True,
            actor_user_id=user.id,
            ip_address=ip_address,
            extra_data={"email": email_lower, "role": CONFIG_USER.ROLE.PATIENT},
        )

        db.commit()
        db.refresh(user)

        return {"user_id": user.id, "message": "Registration successful."}

    except Exception:
        db.rollback()
        raise
