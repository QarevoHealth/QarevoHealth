"""Auth API routes - register, login, logout, refresh."""

from src.api.auth.register import router as register_router

__all__ = ["register_router"]
