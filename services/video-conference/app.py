"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.responses import FileResponse
from pathlib import Path
from src.api.auth import (
    forgot_password_router,
    login_router,
    logout_router,
    refresh_token_router,
    register_router,
    resend_password_reset_router,
    resend_verification_router,
    reset_password_router,
    verify_email_router,
)
from src.api.consultations import router as consultations_router
from src.api.meetings import router as meetings_router
from src.config import config

# Tables: run "python scripts/init_db.py" manually to create

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    debug=config.DEBUG
)

# Mount routes
app.include_router(register_router)
app.include_router(verify_email_router)
app.include_router(resend_verification_router)
app.include_router(login_router)
app.include_router(refresh_token_router)
app.include_router(logout_router)
app.include_router(forgot_password_router)
app.include_router(reset_password_router)
app.include_router(resend_password_reset_router)
app.include_router(consultations_router)
app.include_router(meetings_router)

# Serve join page
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)


@app.get("/join")
def join_page():
    """Serve the join page - users open join_url from create meeting response."""
    join_html = static_dir / "join.html"
    if join_html.exists():
        return FileResponse(join_html)
    return {"message": "Join page not found"}


@app.get("/view-joined")
def view_joined_page():
    """View who has joined a meeting. Add ?meetingId=xxx to auto-load."""
    view_html = static_dir / "view-joined.html"
    if view_html.exists():
        return FileResponse(view_html)
    return {"message": "Page not found"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level=config.LOG_LEVEL.lower()
    )
