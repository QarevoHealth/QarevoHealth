"""Register user use case - creates user, patient, and consents."""

import re
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.constants.user import CONFIG_USER
from src.models import ConsentType, PatientDB, UserConsentDB, UserDB
from src.schemas.auth import RegisterRequest
from src.services.auth_service import hash_password


def _normalize_phone(country_code: str, phone: str) -> str:
    """Store phone as digits only (no spaces, dashes, or plus)."""
    digits = re.sub(r"\D", "", f"{country_code}{phone}")
    return digits


def execute(request: RegisterRequest, db: Session, ip_address: str | None = None):
    """Register a new user (patient) with consents."""
    # Check email uniqueness (case-insensitive)
    email_lower = request.email.lower().strip()
    existing = db.query(UserDB).filter(UserDB.email.ilike(email_lower)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Patients don't have tenant association - tenant_id is blank/null
    tenant_id = None

    # Phone: digits only (no spaces, dashes, or plus)
    phone_normalized = _normalize_phone(
        request.country_code.strip(), request.phone.strip()
    )

    try:
        # Create user
        user = UserDB(
            full_name=request.name,
            tenant_id=tenant_id,
            role=CONFIG_USER.ROLE.PATIENT,
            email=email_lower,
            phone=phone_normalized,
            password_hash=hash_password(request.password),
            status=CONFIG_USER.STATUS.PENDING_VERIFICATION,
            email_verified=False,
        )
        db.add(user)
        db.flush()

        # Create patient (no flush needed - patient.id not used; user.id from flush above)
        patient = PatientDB(
            user_id=user.id,
            full_name=request.name,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
        )
        db.add(patient)

        # Create consents
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
        db.commit()
        db.refresh(user)

        return {"user_id": user.id, "message": "Registration successful."}

    except Exception:
        db.rollback()
        raise
