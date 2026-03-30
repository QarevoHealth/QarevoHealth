"""Split users.full_name into first_name, middle_name, last_name. Remove patients.full_name.

Revision ID: 029
Revises: 028
Create Date: 2026-03-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "029"
down_revision: Union[str, None] = "028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users: add new name columns
    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("middle_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=True))

    # Migrate existing full_name -> first_name (store existing value, last_name empty string as placeholder)
    op.execute("UPDATE users SET first_name = full_name, last_name = '' WHERE first_name IS NULL")

    # Make first_name and last_name NOT NULL after migration
    op.alter_column("users", "first_name", nullable=False)
    op.alter_column("users", "last_name", nullable=False)

    # users: drop old full_name
    op.drop_column("users", "full_name")

    # patients: drop full_name
    op.drop_column("patients", "full_name")


def downgrade() -> None:
    # users: restore full_name
    op.add_column("users", sa.Column("full_name", sa.String(), nullable=True))
    op.execute("UPDATE users SET full_name = first_name || ' ' || last_name")
    op.alter_column("users", "full_name", nullable=False)

    op.drop_column("users", "last_name")
    op.drop_column("users", "middle_name")
    op.drop_column("users", "first_name")

    # patients: restore full_name
    op.add_column("patients", sa.Column("full_name", sa.String(), nullable=True))
