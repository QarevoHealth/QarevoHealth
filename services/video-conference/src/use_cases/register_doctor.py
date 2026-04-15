"""Register doctor use case - creates user (PROVIDER role), provider profile, and consents."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.failure_reasons import FailureReason
from src.constants.user import CONFIG_USER
from src.models import AuditEventCategory, AuditEventType, ConsentType, UserConsentDB, UserDB
from src.models.provider import ProviderDB
from src.schemas.doctor import DoctorRegisterRequest
from src.services.audit_service import write_audit_log
from src.services.auth_service import hash_password
from src.use_cases.send_verification_email import execute as send_verification_email


def execute(request: DoctorRegisterRequest, db: Session, ip_address: str | None = None) -> dict:
    """Register a new doctor (provider) with consents. Sends email verification on success."""
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
            extra_data={"email": email_lower, "role": CONFIG_USER.ROLE.PROVIDER},
            commit=True,
        )
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        user = UserDB(
            first_name=request.first_name,
            middle_name=request.middle_name,
            last_name=request.last_name,
            tenant_id=None,
            role=CONFIG_USER.ROLE.PROVIDER,
            email=email_lower,
            country_code=request.country_code.strip(),
            phone=request.phone.strip(),
            password_hash=hash_password(request.password),
            status=CONFIG_USER.STATUS.PENDING_VERIFICATION,
            email_verified=False,
            phone_verified=False,
        )
        db.add(user)
        db.flush()  # needed to get user.id for provider FK

        provider = ProviderDB(
            user_id=user.id,
            specialty=request.specialty,
            experience_years=request.experience_years,
            license_number=request.license_number,
            is_independent=request.is_independent,
            address_line1=request.address_line1,
            address_line2=request.address_line2,
            address_city=request.address_city,
            address_state=request.address_state,
            address_country=request.address_country,
            address_zip=request.address_zip,
        )
        db.add(provider)

        now = datetime.now(timezone.utc)
        consent_map = {
            ConsentType.TERMS_PRIVACY: request.consents.terms_privacy,
            ConsentType.TELEHEALTH: request.consents.telehealth,
            ConsentType.MARKETING: request.consents.marketing,
        }
        db.add_all([
            UserConsentDB(
                user_id=user.id,
                consent_type=consent_type,
                accepted=accepted,
                accepted_at=now if accepted else None,
                ip_address=ip_address,
            )
            for consent_type, accepted in consent_map.items()
        ])

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
            extra_data={"email": email_lower, "role": CONFIG_USER.ROLE.PROVIDER},
        )

        db.commit()
        db.refresh(user)
        db.refresh(provider)

        return {
            "user_id": user.id,
            "provider_id": provider.id,
            "message": "Doctor registration successful. Please verify your email.",
        }

    except Exception:
        db.rollback()
        raise
