"""Login API - authenticate user and return tokens."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import LoginRequest, LoginResponse
from src.use_cases.login import execute as login_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract IP and user-agent from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    user_agent = request.headers.get("User-Agent")
    return ip, user_agent


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db), request: Request = None):
    """Login with email and password. Returns access_token and refresh_token."""
    ip, user_agent = _get_client_info(request) if request else (None, None)
    result = login_user(body, db, ip_address=ip, user_agent=user_agent)
    return LoginResponse(**result)
