"""Shared error handling for API layer."""

from botocore.exceptions import ClientError

from fastapi import HTTPException


def handle_aws_error(e: Exception) -> None:
    """Convert AWS ClientError to HTTP exceptions. Re-raise others."""
    if isinstance(e, ClientError):
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "NotFoundException":
            raise HTTPException(status_code=404, detail="Meeting not found")
        if error_code == "BadRequestException":
            raise HTTPException(status_code=400, detail=str(e))
    raise HTTPException(status_code=500, detail=str(e))
