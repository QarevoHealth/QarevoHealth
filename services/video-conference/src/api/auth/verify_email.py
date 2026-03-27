"""Verify email API - validate token from email link."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.use_cases.verify_email import execute as verify_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/verify-email")
def verify_email_api(
    token: str,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """
    Verify email using token from verification link.
    Marks token as used, sets user email_verified=True, status=ACTIVE.
    """
    return verify_email(token, db, ip_address=client.ip_address, user_agent=client.user_agent)
