"""Verify email API - validate token from email link."""

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from src.config import config
from src.database import get_db
from src.use_cases.verify_email import execute as verify_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/verify-email")
def verify_email_api(token: str, db: Session = Depends(get_db)):
    """
    Verify email using token from verification link.
    Marks token as used, sets user email_verified=True, status=ACTIVE.
    Redirects to success URL if configured, else returns JSON.
    """
    result = verify_email(token, db)
    if config.EMAIL_VERIFICATION_SUCCESS_URL:
        return RedirectResponse(url=config.EMAIL_VERIFICATION_SUCCESS_URL)
    return result
