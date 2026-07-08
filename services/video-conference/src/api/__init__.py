"""API routes."""
from src.api.providers import router as providers_router

# Append this line where the other routers (auth, consultations) are included
app.include_router(providers_router) # type: ignore