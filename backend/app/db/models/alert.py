"""
Database models for alerts.
"""

from sqlalchemy import JSON, Boolean, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class AlertCurrent(Base):
    """
    Current state of alerts.
    Upserted by fingerprint on each webhook event.
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

    # JSON fields - complete data
    labels = Column(JSON, nullable=False)
    annotations = Column(JSON)
    raw = Column(JSON)  # Complete Grafana payload

    # Acknowledgment
    acked = Column(Boolean, default=False, index=True)
    acked_by = Column(String(255))
    acked_at = Column(DateTime(timezone=True))
    ack_note = Column(Text)
    silenced = Column(Boolean, default=False, index=True, nullable=False)

    __table_args__ = (
        Index("ix_alerts_current_status_severity", "status", "severity"),
        Index("ix_alerts_current_updated_at_desc", updated_at.desc()),
    )

    def __repr__(self) -> str:
        return f"<AlertCurrent {self.alertname} ({self.status})>"


class AlertEvent(Base):
    """
    Historical log of all alert events (append-only).
    Each webhook creates a new record.
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
    raw = Column(JSON)  # Complete payload

    __table_args__ = (Index("ix_alert_events_created_at_desc", created_at.desc()),)

    def __repr__(self) -> str:
        return f"<AlertEvent {self.alertname} ({self.event_type})>"
