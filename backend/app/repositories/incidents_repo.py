"""Repository for incident database operations."""

from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.db.models.incident import Incident, IncidentUpdate


class IncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active(self) -> Incident | None:
        return (
            self.db.query(Incident)
            .options(joinedload(Incident.updates))
            .filter(Incident.is_active == True)
            .order_by(desc(Incident.created_at))
            .first()
        )

    def list_all(self, limit: int = 50, offset: int = 0) -> tuple[list[Incident], int]:
        query = self.db.query(Incident).order_by(desc(Incident.created_at))
        total = query.count()
        items = query.options(joinedload(Incident.updates)).offset(offset).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Incident:
        incident = Incident(**data)
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def finalize(self, incident_id: int, finalized_by: str) -> Incident | None:
        incident = (
            self.db.query(Incident)
            .options(joinedload(Incident.updates))
            .filter(Incident.id == incident_id)
            .first()
        )
        if not incident or not incident.is_active:
            return None
        incident.is_active = False
        incident.finalized_by = finalized_by
        incident.finalized_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def get_by_id(self, incident_id: int) -> Incident | None:
        return (
            self.db.query(Incident)
            .options(joinedload(Incident.updates))
            .filter(Incident.id == incident_id)
            .first()
        )

    def add_update(self, incident_id: int, message: str, created_by: str) -> IncidentUpdate | None:
        incident = self.db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident or not incident.is_active:
            return None
        update = IncidentUpdate(incident_id=incident_id, message=message, created_by=created_by)
        self.db.add(update)
        self.db.commit()
        self.db.refresh(update)
        return update
