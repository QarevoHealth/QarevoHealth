"""Check if database connection is ready."""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Jerry%40001@localhost:5432/postgres")


def check_connection():
    """Check if database connection is ready."""
    if "sqlite" in DATABASE_URL:
        try:
            import sqlite3

            # sqlite:///./video_conference.db -> ./video_conference.db
            db_path = DATABASE_URL.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            conn.close()
            print("Connected! Database is ready.")
            return True
        except Exception as e:
            print(f"Connection failed! Database is not ready.\nError: {e}")
            return False

    # PostgreSQL
    try:
        import psycopg2

        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("Connected! Database is ready.")
        return True
    except ImportError:
        print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"Connection failed! Database is not ready.\nError: {e}")
        return False


if __name__ == "__main__":
    success = check_connection()
    sys.exit(0 if success else 1)
