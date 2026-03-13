"""
Silences management router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.dependencies import get_db
from app.schemas.silence import (
    SilenceCreate,
    SilenceListResponse,
    SilenceResponse,
    SilenceUpdate,
)
from app.services.silences_service import SilenceService

router = APIRouter()
logger = get_logger(__name__)


@router.get("/silences", response_model=SilenceListResponse)
async def list_silences(
    active_only: bool = Query(True, description="Active rules only"), db: Session = Depends(get_db)
):
    """List silence rules."""
    service = SilenceService(db)
    silences = service.list_silences(active_only)

    return SilenceListResponse(total=len(silences), items=silences)


@router.get("/silences/{silence_id}", response_model=SilenceResponse)
async def get_silence(silence_id: int, db: Session = Depends(get_db)):
    """Get silence by ID."""
    service = SilenceService(db)
    silence = service.get_silence(silence_id)

    if not silence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Silence not found")

    return silence


@router.post("/silences", response_model=SilenceResponse, status_code=status.HTTP_201_CREATED)
async def create_silence(silence_data: SilenceCreate, db: Session = Depends(get_db)):
    """
    Create silence rule.

    Matchers define which alerts to silence.
    Example: [{"label": "alertname", "value": "HighCPU", "is_regex": false}]

    All alerts matching ALL matchers will be silenced.
    """
    service = SilenceService(db)
    return service.create_silence(silence_data, silence_data.created_by)


@router.patch("/silences/{silence_id}", response_model=SilenceResponse)
async def update_silence(
    silence_id: int, update_data: SilenceUpdate, db: Session = Depends(get_db)
):
    """Update a silence."""
    service = SilenceService(db)
    silence = service.update_silence(silence_id, update_data)

    if not silence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Silence not found")

    return silence


@router.delete("/silences/{silence_id}", status_code=status.HTTP_200_OK)
async def delete_silence(silence_id: int, db: Session = Depends(get_db)):
    """Delete (deactivate) silence rule."""
    service = SilenceService(db)
    success = service.delete_silence(silence_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Silence not found")

    return {"message": "Silence deactivated"}
