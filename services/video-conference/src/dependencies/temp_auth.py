"""Dependency to validate TEMP_AUTH bearer token for MFA endpoints."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.services.auth_service import decode_temp_auth_token

temp_bearer_scheme = HTTPBearer()


def require_temp_auth_token(
    credentials: HTTPAuthorizationCredentials = Depends(temp_bearer_scheme),
) -> dict:
    token = credentials.credentials
    payload = decode_temp_auth_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired temp auth token")
    return payload

