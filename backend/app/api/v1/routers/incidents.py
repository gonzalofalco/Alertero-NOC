"""API endpoints for incident management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.incident import (
    IncidentCreate,
    IncidentFinalize,
    IncidentListResponse,
    IncidentResponse,
    IncidentUpdateCreate,
    IncidentUpdateResponse,
)
from app.services.incidents_service import IncidentService

router = APIRouter()


@router.get("/incidents/active", response_model=IncidentResponse | None)
async def get_active_incident(db: Session = Depends(get_db)):
    """Get the currently active incident, or null if none."""
    service = IncidentService(db)
    return service.get_active()


@router.get("/incidents", response_model=IncidentListResponse)
async def list_incidents(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all incidents (active and finalized)."""
    service = IncidentService(db)
    return service.list_all(limit, offset)


@router.post("/incidents", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    """Create a new incident. Any currently active incident will be finalized first."""
    service = IncidentService(db)
    return service.create(data)


@router.post("/incidents/{incident_id}/finalize", response_model=IncidentResponse)
async def finalize_incident(
    incident_id: int, data: IncidentFinalize, db: Session = Depends(get_db)
):
    """Finalize (close) an active incident."""
    service = IncidentService(db)
    result = service.finalize(incident_id, data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found or already finalized",
        )
    return result


@router.post(
    "/incidents/{incident_id}/updates",
    response_model=IncidentUpdateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_incident_update(
    incident_id: int, data: IncidentUpdateCreate, db: Session = Depends(get_db)
):
    """Add an update/note to an active incident."""
    service = IncidentService(db)
    result = service.add_update(incident_id, data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found or already finalized",
        )
    return result
