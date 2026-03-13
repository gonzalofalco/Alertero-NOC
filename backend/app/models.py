"""
Modelos de base de datos SQLAlchemy.
"""

from sqlalchemy import JSON, Boolean, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AlertCurrent(Base):
    """
    Estado actual de las alertas.
    Se hace upsert por fingerprint cada vez que llega un webhook.
    """

    __tablename__ = "alerts_current"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fingerprint = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # firing, resolved
    severity = Column(String(20), index=True)  # critical, warning, info
    alertname = Column(String(255), nullable=False, index=True)
    instance = Column(String(255), index=True)
    team = Column(String(100), index=True)

    starts_at = Column(DateTime(timezone=True))
    ends_at = Column(DateTime(timezone=True))

    summary = Column(Text)
    description = Column(Text)
    generator_url = Column(String(512))
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), index=True
    )

    # JSON completos
    labels = Column(JSON, nullable=False)
    annotations = Column(JSON)
    raw = Column(JSON)  # Payload completo de Grafana

    # ACK
    acked = Column(Boolean, default=False, index=True)
    acked_by = Column(String(255))
    acked_at = Column(DateTime(timezone=True))
    ack_note = Column(Text)
    silenced = Column(Boolean, default=False, index=True, nullable=False)

    __table_args__ = (
        Index("ix_alerts_current_status_severity", "status", "severity"),
        Index("ix_alerts_current_updated_at_desc", updated_at.desc()),
    )


class AlertEvent(Base):
    """
    Historial de todos los eventos de alertas (append-only).
    Cada webhook genera un nuevo registro.
    """

    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    fingerprint = Column(String(64), nullable=False, index=True)
    event_type = Column(String(20), nullable=False)
    severity = Column(String(20), nullable=False)
    alertname = Column(String(255), nullable=False)
    instance = Column(String(255))
    team = Column(String(100))
    summary = Column(Text)
    description = Column(Text)
    generator_url = Column(String(512))
    status = Column(String(20), nullable=False, index=True)

    labels = Column(JSON, nullable=False)
    annotations = Column(JSON)
    raw = Column(JSON)  # Payload completo

    __table_args__ = (Index("ix_alert_events_created_at_desc", created_at.desc()),)


class Silence(Base):
    """
    Silencios locales configurables.
    """

    __tablename__ = "silences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Matchers: [{label: "alertname", value: "HighCPU", is_regex: false}]
    matchers = Column(JSON, nullable=False)

    created_by = Column(String(255), nullable=False)
    note = Column(Text)
    active = Column(Boolean, default=True, index=True)

    __table_args__ = (Index("ix_silences_active_expires", "active", "expires_at"),)
