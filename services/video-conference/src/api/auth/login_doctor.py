"""Doctor login API — username + password."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.doctor import DoctorLoginRequest, DoctorLoginResponse
from src.use_cases.login_doctor import execute as login_doctor

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/doctor/login", response_model=DoctorLoginResponse)
def doctor_login(
    body: DoctorLoginRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """Doctor login with username and password. Email must be verified."""
    result = login_doctor(body, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return DoctorLoginResponse(**result)
