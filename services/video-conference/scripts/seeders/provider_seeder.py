"""Provider (doctor) seeder."""

from src.models import ProviderDB, UserDB


def seed_providers(db, tenants):
    """Create users and providers (doctors)."""
    doctors_data = [
        ("Dr. Sarah Johnson", "sarah.johnson@qarevohealth.com", "+1-555-1001", "Cardiology", 12, "MD-CARD-001"),
        ("Dr. Michael Chen", "michael.chen@qarevohealth.com", "+1-555-1002", "General Practice", 8, "MD-GP-002"),
        ("Dr. Emily Davis", "emily.davis@sunrisemedical.com", "+1-555-2001", "Pediatrics", 15, "MD-PED-003"),
    ]
    providers_created = []
    for i, (name, email, phone, specialty, exp_years, license_no) in enumerate(doctors_data):
        tenant = tenants[i % len(tenants)]
        user = UserDB(
            full_name=name,
            tenant_id=tenant.id,
            role="PROVIDER",
            email=email,
            phone=phone,
            password_hash="",
            status="ACTIVE",
        )
        db.add(user)
        db.flush()
        provider = ProviderDB(
            user_id=user.id,
            specialty=specialty,
            experience_years=exp_years,
            license_number=license_no,
            is_independent=False,
        )
        db.add(provider)
        providers_created.append(provider)
    db.commit()
    print(f"  Created {len(providers_created)} providers (doctors)")
    return providers_created
