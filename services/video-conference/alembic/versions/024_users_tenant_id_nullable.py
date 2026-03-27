"""ALTER users: tenant_id nullable (patients don't have tenant association)

Revision ID: 024
Revises: 023
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op

revision: str = "024"
down_revision: Union[str, None] = "023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "tenant_id",
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "tenant_id",
        nullable=False,
    )
