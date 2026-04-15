"""Patient registration API route."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import RegisterRequest, RegisterResponse
from src.use_cases.register_user import execute as register_user

router = APIRouter(prefix="/api/v1/patient", tags=["patient"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """Register a new patient with consents.

    Mandatory consents: terms_privacy, telehealth (both must be True).
    Marketing is optional (default False).
    """
    result = register_user(body, db, ip_address=client.ip_address)
    return RegisterResponse(**result)
