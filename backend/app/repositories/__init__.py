"""Repository layer for data access."""

from app.repositories.alerts_repo import AlertRepository
from app.repositories.silences_repo import SilenceRepository

__all__ = [
    "AlertRepository",
    "SilenceRepository",
]
