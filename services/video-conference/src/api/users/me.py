"""Me API - return logged-in user profile."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.dependencies.auth import get_current_user
from src.models import UserDB

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class MeResponse(BaseModel):
    user_id: UUID
    first_name: str
    middle_name: Optional[str]
    last_name: str
    email: Optional[str]
    country_code: Optional[str]
    phone: Optional[str]
    role: Optional[str]
    status: Optional[str]
    email_verified: bool


@router.get("/me", response_model=MeResponse)
def me(current_user: UserDB = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return MeResponse(
        user_id=current_user.id,
        first_name=current_user.first_name,
        middle_name=current_user.middle_name,
        last_name=current_user.last_name,
        email=current_user.email,
        country_code=current_user.country_code,
        phone=current_user.phone,
        role=current_user.role,
        status=current_user.status,
        email_verified=current_user.email_verified,
    )
