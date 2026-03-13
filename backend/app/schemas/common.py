"""
Common schemas used across the application.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    timestamp: datetime
    version: str
    environment: str
    database: str = "connected"


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    timestamp: datetime | None = None
    path: str | None = None
    request_id: str | None = None


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
    detail: Any | None = None


class WebhookResponse(BaseModel):
    """Webhook processing response."""

    status: str
    processed_alerts: int
    fingerprints: list[str]
    message: str
