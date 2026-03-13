"""Service layer for incident business logic."""

from sqlalchemy.orm import Session

from app.repositories.incidents_repo import IncidentRepository
from app.schemas.incident import (
    IncidentCreate,
    IncidentFinalize,
    IncidentListResponse,
    IncidentResponse,
    IncidentUpdateCreate,
    IncidentUpdateResponse,
)


class IncidentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = IncidentRepository(db)

    def get_active(self) -> IncidentResponse | None:
        incident = self.repo.get_active()
        if not incident:
            return None
        return IncidentResponse.model_validate(incident)

    def list_all(self, limit: int = 50, offset: int = 0) -> IncidentListResponse:
        items, total = self.repo.list_all(limit, offset)
        return IncidentListResponse(
            total=total,
            items=[IncidentResponse.model_validate(i) for i in items],
        )

    def create(self, data: IncidentCreate) -> IncidentResponse:
        # Finalize any currently active incident before creating a new one
        active = self.repo.get_active()
        if active:
            self.repo.finalize(active.id, data.created_by)

        incident = self.repo.create(data.model_dump())
        return IncidentResponse.model_validate(incident)

    def finalize(self, incident_id: int, data: IncidentFinalize) -> IncidentResponse | None:
        incident = self.repo.finalize(incident_id, data.finalized_by)
        if not incident:
            return None
        return IncidentResponse.model_validate(incident)

    def add_update(self, incident_id: int, data: IncidentUpdateCreate) -> IncidentUpdateResponse | None:
        update = self.repo.add_update(incident_id, data.message, data.created_by)
        if not update:
            return None
        return IncidentUpdateResponse.model_validate(update)
