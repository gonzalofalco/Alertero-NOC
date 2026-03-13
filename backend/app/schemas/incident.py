"""Pydantic schemas for incidents."""

from datetime import datetime

from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    created_by: str = Field(..., min_length=1, max_length=255)


class IncidentFinalize(BaseModel):
    finalized_by: str = Field(..., min_length=1, max_length=255)


class IncidentUpdateCreate(BaseModel):
    message: str = Field(..., min_length=1)
    created_by: str = Field(..., min_length=1, max_length=255)


class IncidentUpdateResponse(BaseModel):
    id: int
    incident_id: int
    message: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentResponse(BaseModel):
    id: int
    title: str
    message: str
    is_active: bool
    created_by: str
    finalized_by: str | None = None
    created_at: datetime
    updated_at: datetime
    finalized_at: datetime | None = None
    updates: list[IncidentUpdateResponse] = []

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    total: int
    items: list[IncidentResponse]
