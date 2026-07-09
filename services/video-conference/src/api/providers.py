"""Providers API - discovery and matching endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models import ProviderDB, UserDB
from src.models.schemas import EligibleProvidersResponse, EligibleProviderDetail

router = APIRouter(prefix="/api/v1/providers", tags=["providers"])


@router.get("/eligible", response_model=EligibleProvidersResponse)
def get_eligible_providers_api(
    specialty: str = Query(..., description="The medical specialty to filter by"),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """
    Find eligible providers within the logged-in user's tenant space.
    
    CRITICAL SCOPE LIMITATIONS:
    - Assumes active accounts (is_active=True) are fundamentally eligible.
    - Does not cross-reference real-time calendar availability states.
    """
    # 1. Enforce multi-tenancy by using the logged-in user's tenant ID
    tenant_id = getattr(current_user, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(
            status_code=403, 
            detail="User session context lacks a valid tenant assignment."
        )

    # 2. Build the optimized, deterministic query
    matching_providers = (
        db.query(ProviderDB)
        .options(joinedload(ProviderDB.user))  # Avoids N+1 when reading profile info
        .filter(
            ProviderDB.tenant_id == tenant_id,
            ProviderDB.specialty == specialty,
            ProviderDB.is_active == True,
        )
        .order_by(ProviderDB.id.asc())  # Fixed: Guarantees a stable, predictable match window
        .limit(5)
        .all()
    )

    # 3. Serialize output payloads cleanly
    serialized_providers = []
    for provider in matching_providers:
        user_profile = provider.user
        full_name = (
            f"{user_profile.first_name} {user_profile.last_name}".strip()
            if user_profile
            else "Unknown Provider"
        )
        
        serialized_providers.append(
            EligibleProviderDetail(
                provider_id=provider.id,
                user_id=provider.user_id,
                full_name=full_name,
                specialty=provider.specialty,
                is_active=provider.is_active,
            )
        )

    return EligibleProvidersResponse(providers=serialized_providers)