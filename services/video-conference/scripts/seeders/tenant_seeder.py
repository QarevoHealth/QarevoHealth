"""Tenant seeder."""

from src.models import TenantDB


def seed_tenants(db):
    """Create sample tenants."""
    tenants = [
        TenantDB(
            name="Qarevo Health Clinic",
            logo_url="https://example.com/logo.png",
            support_email="support@qarevohealth.com",
            support_phone="+1-555-0100",
        ),
        TenantDB(
            name="Sunrise Medical Center",
            logo_url="https://example.com/sunrise-logo.png",
            support_email="help@sunrisemedical.com",
            support_phone="+1-555-0200",
        ),
    ]
    for t in tenants:
        db.add(t)
    db.commit()
    print(f"  Created {len(tenants)} tenants")
    return tenants
