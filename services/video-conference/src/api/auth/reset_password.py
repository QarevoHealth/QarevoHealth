"""Reset password API - set new password with token from email link."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import ResetPasswordRequest, ResetPasswordResponse
from src.use_cases.reset_password import execute as reset_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password_api(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """
    Reset password using token from email link.

    User lands on reset screen (from link), enters new password (min 8 chars).
    Token must be valid, not expired, not used, not invalidated.
    """
    result = reset_password(body.token, body.new_password, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return ResetPasswordResponse(**result)
