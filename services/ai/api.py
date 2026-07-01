from fastapi import APIRouter, HTTPException, Depends
from services.ai.schemas import AIDraftRequest, AIDraftResponse
from services.ai.providers.mock import MockAIProvider
from services.ai.interface import AIService

router = APIRouter(prefix="/ai", tags=["AI Platform Boundary"])

# Dependency Injection helper to resolve the active provider setup
def get_ai_service() -> AIService:
    # Under current ticket constraints, we strictly return the deterministic MockProvider
    provider = MockAIProvider()
    return AIService(provider=provider)

@router.post("/draft", response_model=AIDraftResponse, status_code=200)
async def create_ai_draft(
    request: AIDraftRequest, 
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Secure ingestion endpoint for generating automated drafts.
    Enforces Pydantic schema validation and structural safety boundary gates.
    """
    try:
        response = await ai_service.execute_drafting(request)
        return response
    except ValueError as val_err:
        # Catch explicit domain logic/policy gate validation rejections
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Internal service boundary failure: {str(err)}")