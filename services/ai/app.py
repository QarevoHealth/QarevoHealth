from fastapi import FastAPI, Depends
from services.ai.schemas import AIDraftRequest, AIDraftResponse
from services.ai.providers.mock import MockAIProvider

app = FastAPI(title="Qarevo AI Service")

# Dependency injection for the provider
def get_provider():
    return MockAIProvider()

@app.post("/draft/summary", response_model=AIDraftResponse)
async def generate_draft(
    request: AIDraftRequest, 
    provider: MockAIProvider = Depends(get_provider)
):
    """
    Endpoint for clinical documentation drafting.
    Validates inputs, checks policy gates, and returns a summary.
    """
    return await provider.generate_summary_draft(request)