"""
Pydantic schemas for alert-related operations.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ============================================
# WEBHOOK SCHEMAS (Grafana Input)
# ============================================


class GrafanaAlert(BaseModel):
    """Individual alert within Grafana webhook payload."""

    status: str
    labels: dict[str, Any]
    annotations: dict[str, Any] = {}
    startsAt: datetime
    endsAt: datetime | None = None
    generatorURL: str | None = None
    fingerprint: str | None = None
    silenceURL: str | None = None
    dashboardURL: str | None = None
    panelURL: str | None = None
    values: dict[str, Any] | None = None


class GrafanaWebhookPayload(BaseModel):
    """Complete Grafana Alerting webhook payload."""

    receiver: str
    status: str
    alerts: list[GrafanaAlert]
    groupLabels: dict[str, Any] = {}
    commonLabels: dict[str, Any] = {}
    commonAnnotations: dict[str, Any] = {}
    externalURL: str
    version: str | None = None
    groupKey: str | None = None
    truncatedAlerts: int | None = 0
    orgId: int | None = None
    title: str | None = None
    state: str | None = None
    message: str | None = None


# ============================================
# ALERT RESPONSE SCHEMAS
# ============================================


class AlertCurrentResponse(BaseModel):
    """Alert current state response."""

    id: int
    fingerprint: str
    status: str
    severity: str | None = None
    alertname: str
    instance: str | None = None
    team: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    summary: str | None = None
    description: str | None = None
    generator_url: str | None = None
    updated_at: datetime
    labels: dict[str, Any]
    annotations: dict[str, Any] | None = None
    raw: dict[str, Any] | None = None
    acked: bool = False
    acked_by: str | None = None
    acked_at: datetime | None = None
    ack_note: str | None = None
    silenced: bool = False

    model_config = {"from_attributes": True}


class AlertEventResponse(BaseModel):
    """Alert event history response."""

    id: int
    created_at: datetime
    fingerprint: str
    event_type: str
    severity: str
    alertname: str
    instance: str | None = None
    team: str | None = None
    summary: str | None = None
    description: str | None = None
    generator_url: str | None = None
    status: str
    labels: dict[str, Any]
    annotations: dict[str, Any] | None = None
    raw: dict[str, Any] | None = None

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    """Paginated alert list response."""

    total: int
    limit: int
    offset: int
    items: list[AlertCurrentResponse]


class AlertStatsResponse(BaseModel):
    """Alert statistics response."""

    total: int
    firing: int
    resolved: int
    critical: int
    warning: int
    info: int
    acked: int
    by_team: dict[str, int] = {}
    by_severity: dict[str, int] = {}


# ============================================
# ALERT REQUEST SCHEMAS
# ============================================


class AlertAckRequest(BaseModel):
    """Request to acknowledge an alert."""

    acked_by: str = Field(..., min_length=1, max_length=255)
    note: str | None = None


class AlertFilterParams(BaseModel):
    """Query parameters for filtering alerts."""

    status: str | None = None
    severity: str | None = None
    team: str | None = None
    alertname: str | None = None
    show_acked: bool = True
    show_silenced: bool = False
    limit: int = Field(100, ge=1, le=2000)
    offset: int = Field(0, ge=0)
