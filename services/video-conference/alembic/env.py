"""
Alembic environment configuration.

BEST PRACTICE: Database URL comes from .env (DATABASE_URL), not alembic.ini.
- Secure: no credentials in version control
- Flexible: different URLs per dev/staging/prod
"""

import sys
from pathlib import Path

# Add project root to path so we can import src
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool
from alembic import context

# Import config and models
from src.config import config
from src.database import Base
from src.models import (  # noqa: F401 - register models for autogenerate
    AppointmentDB,
    AppointmentProviderDB,
    ConsultationDB,
    ConsultationProviderDB,
    EmailVerificationTokenDB,
    PhoneVerificationOtpDB,
    PatientDB,
    PatientInsuranceDB,
    PasswordResetTokenDB,
    ProviderDB,
    RefreshTokenDB,
    TenantDB,
    UserDB,
    UserConsentDB,
    UserIdentityDB,
    VideoSessionArtifactDB,
    VideoSessionAttendeeDB,
    VideoSessionDB,
)

# this is the Alembic Config object
config_alembic = context.config

# Interpret the config file for Python logging
if config_alembic.config_file_name is not None:
    fileConfig(config_alembic.config_file_name)

# Model metadata for autogenerate
target_metadata = Base.metadata


def get_url():
    """Get database URL with optional SQLite connect_args."""
    return config.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = get_url()
    connect_args = {"check_same_thread": False} if "sqlite" in url else {}
    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
