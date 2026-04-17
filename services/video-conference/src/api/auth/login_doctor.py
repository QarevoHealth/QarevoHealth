"""Doctor login API - enforces doctor 2FA flow."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.auth import DoctorLoginRequest, LoginResponse
from src.use_cases.login_doctor import execute as login_doctor

router = APIRouter(prefix="/api/v1/auth/doctor", tags=["auth - doctor"])


@router.post("/login", response_model=LoginResponse)
def doctor_login(
    body: DoctorLoginRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    result = login_doctor(body, db, ip_address=client.ip_address, user_agent=client.user_agent)
    return LoginResponse(**result)
