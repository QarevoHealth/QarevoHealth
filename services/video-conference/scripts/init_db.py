#!/usr/bin/env python3
"""
Database initialization script.
Creates all tables in the database.

Usage:
    python scripts/init_db.py
    
Or from project root:
    python -m scripts.init_db
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.database import init_db, engine
from src.config import config
from src.models import AttendeeDB, MeetingDB  # noqa: F401 - needed for table creation


def main():
    print(f"Connecting to: {config.DATABASE_URL}")
    print("Creating tables...")
    init_db()
    print("Done! Tables created: meetings, attendees")


if __name__ == "__main__":
    main()
