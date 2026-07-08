#!/usr/bin/env python3
"""
Seed a minimal tenant, user, and provider for testing the providers endpoint.
Usage:
  python scripts/seed_test_provider.py
"""
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from uuid import uuid4
from src.database import SessionLocal
from src.models import TenantDB, UserDB, ProviderDB


def main():
    db = SessionLocal()
    try:
        # Create tenant
        tenant = TenantDB(name="Test Tenant")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

        # Create user associated with tenant
        user = UserDB(
            first_name="Test",
            last_name="Provider",
            email="test.provider@example.com",
            tenant_id=tenant.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create provider linked to user
        provider = ProviderDB(
            user_id=user.id,
            username=f"provider_{str(uuid4())[:8]}",
            specialty="cardiology",
            experience_years=5,
            license_number="LIC12345",
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)

        print("Seeded tenant, user, provider:")
        print(f"tenant.id={tenant.id}")
        print(f"user.id={user.id}")
        print(f"provider.id={provider.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
