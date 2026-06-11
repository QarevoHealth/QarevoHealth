from fastapi import FastAPI

# This is the "app" variable Uvicorn is looking for
app = FastAPI(title="Qarevo Video Conference Service")

@app.get("/")
async def root():
    return {"message": "Qarevo Backend is Live", "status": "MVP-010 Standardized"}

@app.get("/health")
async def health_check():
    # This fulfills the "Heartbeat" requirement for MVP-010
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
