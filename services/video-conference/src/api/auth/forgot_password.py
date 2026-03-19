"""Forgot password API - sends password reset email."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import ForgotPasswordRequest, ForgotPasswordResponse
from src.use_cases.request_password_reset import execute as request_password_reset

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset - sends email with link if account exists.

    Always returns 200 for security (does not reveal if email exists).
    3 attempts per day, then 1-day lockout. Link valid for 60 minutes (configurable).
    """
    result = request_password_reset(body.email, db)
    return ForgotPasswordResponse(**result)
