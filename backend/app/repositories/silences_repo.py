"""
Repository layer for silence data access.
Encapsulates all database queries for silences.
"""

from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.models import Silence
from app.schemas.silence import SilenceCreate, SilenceUpdate


class SilenceRepository:
    """Repository for silence data access operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, silence_data: SilenceCreate, created_by: str) -> Silence:
        """Create a new silence."""
        silence = Silence(
            matchers=[m.model_dump() for m in silence_data.matchers],
            expires_at=silence_data.expires_at,
            created_by=created_by,
            note=silence_data.note,
            active=True,
        )
        self.db.add(silence)
        self.db.commit()
        self.db.refresh(silence)
        return silence

    def get_by_id(self, silence_id: int) -> Silence | None:
        """Get silence by ID."""
        return self.db.query(Silence).filter(Silence.id == silence_id).first()

    def list_all(self, active_only: bool = False) -> list[Silence]:
        """List all silences."""
        query = self.db.query(Silence)

        if active_only:
            query = query.filter(Silence.active == True)

        return query.order_by(desc(Silence.created_at)).all()

    def list_active(self) -> list[Silence]:
        """Get all active and not expired silences."""
        now = datetime.now(timezone.utc)
        return self.db.query(Silence).filter(Silence.active == True, Silence.expires_at > now).all()

    def update(self, silence: Silence, update_data: SilenceUpdate) -> Silence:
        """Update a silence."""
        if update_data.expires_at is not None:
            silence.expires_at = update_data.expires_at
        if update_data.note is not None:
            silence.note = update_data.note
        if update_data.active is not None:
            silence.active = update_data.active

        self.db.commit()
        self.db.refresh(silence)
        return silence

    def delete(self, silence_id: int) -> bool:
        """Delete a silence (soft delete by setting active=False)."""
        silence = self.get_by_id(silence_id)
        if not silence:
            return False

        silence.active = False
        self.db.commit()
        return True

    def expire_old_silences(self) -> int:
        """
        Mark expired silences as inactive.
        Returns count of expired silences.
        """
        now = datetime.now(timezone.utc)
        count = (
            self.db.query(Silence)
            .filter(Silence.active == True, Silence.expires_at <= now)
            .update({"active": False})
        )

        self.db.commit()
        return count
