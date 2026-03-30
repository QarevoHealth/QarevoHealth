"""Client info dependency - extracts IP address and User-Agent from the request."""

from dataclasses import dataclass

from fastapi import Request


@dataclass
class ClientInfo:
    ip_address: str | None
    user_agent: str | None


def get_client_info(request: Request) -> ClientInfo:
    """FastAPI dependency — use with Depends(get_client_info)."""
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    return ClientInfo(ip_address=ip, user_agent=request.headers.get("User-Agent"))
