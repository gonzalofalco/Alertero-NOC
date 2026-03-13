"""
Pydantic schemas for silence-related operations.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ============================================
# SILENCE SCHEMAS
# ============================================


class SilenceMatcher(BaseModel):
    """Matcher for silence rules."""

    label: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)
    is_regex: bool = False


class SilenceCreate(BaseModel):
    """Request to create a silence."""

    matchers: list[SilenceMatcher] = Field(..., min_items=1)
    expires_at: datetime
    created_by: str = Field(..., min_length=1, max_length=255)
    note: str | None = None


class SilenceUpdate(BaseModel):
    """Request to update a silence."""

    expires_at: datetime | None = None
    note: str | None = None
    active: bool | None = None


class SilenceResponse(BaseModel):
    """Silence response."""

    id: int
    created_at: datetime
    expires_at: datetime
    matchers: list[dict[str, Any]]
    created_by: str
    note: str | None = None
    active: bool

    model_config = {"from_attributes": True}


class SilenceListResponse(BaseModel):
    """List of silences response."""

    total: int
    items: list[SilenceResponse]
