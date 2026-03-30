"""Refresh token API - access token renewal with refresh token rotation."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import LoginResponse, RefreshRequest
from src.use_cases.refresh_token import execute as refresh_tokens

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/refresh", response_model=LoginResponse)
def refresh(
    body: RefreshRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """
    Access token renewal with refresh token rotation.

    Exchange refresh token for new access_token and refresh_token.
    Old refresh token is invalidated (rotation). Client must store the new refresh token.
    """
    result = refresh_tokens(body.refresh_token, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return LoginResponse(**result)
