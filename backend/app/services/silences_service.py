"""
Service layer for silence business logic.
"""

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.repositories.silences_repo import SilenceRepository
from app.schemas.silence import (
    SilenceCreate,
    SilenceResponse,
    SilenceUpdate,
)

logger = get_logger(__name__)


class SilenceService:
    """Service for silence business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.silence_repo = SilenceRepository(db)

    def create_silence(self, silence_data: SilenceCreate, created_by: str) -> SilenceResponse:
        """Create a new silence."""
        silence = self.silence_repo.create(silence_data, created_by)
        logger.info(f"Created silence {silence.id} by {created_by}")
        return SilenceResponse.model_validate(silence)

    def list_silences(self, active_only: bool = False) -> list[SilenceResponse]:
        """List all silences."""
        silences = self.silence_repo.list_all(active_only)
        return [SilenceResponse.model_validate(s) for s in silences]

    def get_silence(self, silence_id: int) -> SilenceResponse | None:
        """Get silence by ID."""
        silence = self.silence_repo.get_by_id(silence_id)
        if not silence:
            return None
        return SilenceResponse.model_validate(silence)

    def update_silence(self, silence_id: int, update_data: SilenceUpdate) -> SilenceResponse | None:
        """Update a silence."""
        silence = self.silence_repo.get_by_id(silence_id)
        if not silence:
            return None

        updated_silence = self.silence_repo.update(silence, update_data)
        logger.info(f"Updated silence {silence_id}")
        return SilenceResponse.model_validate(updated_silence)

    def delete_silence(self, silence_id: int) -> bool:
        """Delete a silence (soft delete)."""
        success = self.silence_repo.delete(silence_id)
        if success:
            logger.info(f"Deleted silence {silence_id}")
        return success

    def expire_old_silences(self) -> int:
        """Expire old silences and return count."""
        count = self.silence_repo.expire_old_silences()
        if count > 0:
            logger.info(f"Expired {count} old silences")
        return count
