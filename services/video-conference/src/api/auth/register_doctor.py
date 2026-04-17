"""Doctor registration API route."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.client_info import ClientInfo, get_client_info
from src.schemas.doctor import DoctorRegisterRequest, DoctorRegisterResponse
from src.use_cases.register_doctor import execute as register_doctor

router = APIRouter(prefix="/api/v1/auth", tags=["auth - doctor"])


@router.post("/register/doctor", response_model=DoctorRegisterResponse, status_code=201)
def register_doctor_endpoint(
    body: DoctorRegisterRequest,
    db: Session = Depends(get_db),
    client: ClientInfo = Depends(get_client_info),
):
    """Register a new doctor (provider).

    Creates a user account with PROVIDER role + a provider profile.
    Sends a verification email with a 6-digit OTP on success.

    - specialty, experience_years, license_number are optional at registration
    - Doctor must verify email before logging in
    - Phone 2FA is required only after full verification (phone + license)
    """
    result = register_doctor(body, db, ip_address=client.ip_address)
    return DoctorRegisterResponse(**result)
