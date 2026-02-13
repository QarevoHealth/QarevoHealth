"""FastAPI application entrypoint."""

from fastapi import FastAPI
from src.api.meetings import router as meetings_router
from src.config import config

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    debug=config.DEBUG
)

# Mount routes
app.include_router(meetings_router)


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
