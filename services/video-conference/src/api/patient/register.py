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
    """Register a new patient. Only email and password are required.

    Name, phone, DOB, gender, and consents are optional and can be completed later.
    Omitted consents are stored as not accepted until updated.
    """
    result = register_user(body, db, ip_address=client.ip_address)
    return RegisterResponse(**result)
