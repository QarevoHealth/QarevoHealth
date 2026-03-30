"""Login API - authenticate user and return tokens."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import LoginRequest, LoginResponse
from src.use_cases.login import execute as login_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """Login with email and password. Returns access_token and refresh_token."""
    result = login_user(body, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return LoginResponse(**result)
