"""Seeders - one file per entity."""

from scripts.seeders.patient_seeder import seed_patients
from scripts.seeders.provider_seeder import seed_providers
from scripts.seeders.tenant_seeder import seed_tenants

__all__ = ["seed_tenants", "seed_providers", "seed_patients"]
