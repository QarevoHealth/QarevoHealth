"""Refresh token API - access token renewal with refresh token rotation."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import LoginResponse, RefreshRequest
from src.use_cases.refresh_token import execute as refresh_tokens

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract IP and user-agent from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    user_agent = request.headers.get("User-Agent")
    return ip, user_agent


@router.post("/refresh", response_model=LoginResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db), request: Request = None):
    """
    Access token renewal with refresh token rotation.

    Exchange refresh token for new access_token and refresh_token.
    Old refresh token is invalidated (rotation). Client must store the new refresh token.
    """
    ip, user_agent = _get_client_info(request) if request else (None, None)
    result = refresh_tokens(body.refresh_token, db, ip_address=ip, user_agent=user_agent)
    return LoginResponse(**result)
