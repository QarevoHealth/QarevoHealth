"""Register API - patient registration with validation (under auth)."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.auth import RegisterRequest, RegisterResponse
from src.use_cases.register_user import execute as register_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_client_ip(request: Request) -> str | None:
    """Extract client IP from request (supports X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    request: Request = None,
):
    """Register a new patient with consents.
    
    Mandatory consents: terms_privacy, telehealth (both must be True).
    Marketing is optional (default False).
    """
    ip_address = get_client_ip(request) if request else None
    result = register_user(body, db, ip_address=ip_address)
    return RegisterResponse(**result)
