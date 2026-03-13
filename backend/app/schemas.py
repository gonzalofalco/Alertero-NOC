"""
Schemas Pydantic para validación de datos de entrada/salida.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ============================================
# WEBHOOK SCHEMAS
# ============================================


class GrafanaAlert(BaseModel):
    """Alerta individual dentro del payload de Grafana"""

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
    """Payload completo de Grafana Alerting"""

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
# ALERT SCHEMAS
# ============================================


class AlertBase(BaseModel):
    fingerprint: str
    status: str
    severity: str | None = None
    alertname: str
    instance: str | None = None
    team: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    labels: dict[str, Any]
    annotations: dict[str, Any] = {}


class AlertCurrentResponse(AlertBase):
    """Respuesta de alerta actual"""

    updated_at: datetime
    acked: bool = False
    acked_by: str | None = None
    acked_at: datetime | None = None
    ack_note: str | None = None

    class Config:
        from_attributes = True


class AlertEventResponse(BaseModel):
    """Respuesta de evento de alerta"""

    id: int
    received_at: datetime
    fingerprint: str
    status: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    labels: dict[str, Any]
    annotations: dict[str, Any] = {}

    class Config:
        from_attributes = True


class AlertAckRequest(BaseModel):
    """Request para ACK de alerta"""

    acked_by: str = Field(..., min_length=1, max_length=255)
    note: str | None = None


# ============================================
# SILENCE SCHEMAS
# ============================================


class SilenceMatcher(BaseModel):
    """Matcher para silencios"""

    label: str
    value: str
    is_regex: bool = False


class SilenceCreateRequest(BaseModel):
    """Request para crear silencio"""

    duration_minutes: int = Field(..., gt=0, le=43200)  # Max 30 días
    matchers: list[SilenceMatcher] = Field(..., min_length=1)
    created_by: str = Field(..., min_length=1, max_length=255)
    note: str | None = None


class SilenceResponse(BaseModel):
    """Respuesta de silencio"""

    id: int
    created_at: datetime
    expires_at: datetime
    matchers: list[dict[str, Any]]
    created_by: str
    note: str | None = None
    active: bool

    class Config:
        from_attributes = True


# ============================================
# PAGINATION & FILTERS
# ============================================


class AlertListResponse(BaseModel):
    """Respuesta paginada de alertas"""

    total: int
    limit: int
    offset: int
    items: list[AlertCurrentResponse]


# ============================================
# HEALTH CHECK
# ============================================


class HealthResponse(BaseModel):
    """Health check response"""

    status: str
    database: str
    timestamp: datetime
