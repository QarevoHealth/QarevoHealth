"""Logout API - revoke refresh token to invalidate session."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import LogoutRequest, LogoutResponse
from src.use_cases.logout import execute as logout_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/logout", response_model=LogoutResponse)
def logout(
    body: LogoutRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """
    Logout - revoke refresh token to invalidate session.

    Client should discard stored access_token and refresh_token after logout.
    """
    result = logout_user(body.refresh_token, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return LogoutResponse(**result)
