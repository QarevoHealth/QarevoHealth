#!/usr/bin/env python3
"""
Seed script - inserts sample data into tenants, users, patients, providers.

Usage:
    python scripts/seed_data.py
    python scripts/seed_data.py --force   # Re-seed (clears existing seed data first)

Or from project root:
    python -m scripts.seed_data

Prerequisites:
    - Run migrations first: alembic upgrade head
    - PostgreSQL database (DATABASE_URL in .env)
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.config import config
from src.database import SessionLocal
from src.models import PatientDB, ProviderDB, TenantDB, UserDB

from scripts.seeders import seed_patients, seed_providers, seed_tenants


def main():
    force = "--force" in sys.argv or "-f" in sys.argv
    print(f"Connecting to: {config.DATABASE_URL}")
    db = SessionLocal()
    try:
        if db.query(TenantDB).first() and not force:
            print("Data already exists. Skipping seed. Use --force to re-seed.")
            return

        if force and db.query(TenantDB).first():
            print("Force mode: clearing existing seed data...")
            db.query(PatientDB).delete()
            db.query(ProviderDB).delete()
            db.query(UserDB).delete()
            db.query(TenantDB).delete()
            db.commit()
            db = SessionLocal()

        print("Seeding tenants...")
        tenants = seed_tenants(db)

        print("Seeding providers (doctors)...")
        seed_providers(db, tenants)

        print("Seeding patients...")
        seed_patients(db, tenants)

        print("Done! Seed data inserted successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
