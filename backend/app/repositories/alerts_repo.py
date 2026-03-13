"""
Repository layer for alert data access.
Encapsulates all database queries for alerts.
"""

from datetime import datetime, timezone

from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from app.db.models import AlertCurrent, AlertEvent
from app.schemas.alert import AlertFilterParams


class AlertRepository:
    """Repository for alert data access operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_current_by_fingerprint(self, fingerprint: str) -> AlertCurrent | None:
        """Get current alert by fingerprint."""
        return self.db.query(AlertCurrent).filter(AlertCurrent.fingerprint == fingerprint).first()

    def create_current(self, alert_data: dict) -> AlertCurrent:
        """Create a new current alert."""
        alert = AlertCurrent(**alert_data)
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def update_current(self, alert: AlertCurrent, update_data: dict) -> AlertCurrent:
        """Update an existing current alert."""
        for key, value in update_data.items():
            setattr(alert, key, value)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def upsert_current(self, fingerprint: str, alert_data: dict) -> AlertCurrent:
        """Upsert alert by fingerprint (update if exists, create if not)."""
        alert = self.get_current_by_fingerprint(fingerprint)
        if alert:
            return self.update_current(alert, alert_data)
        else:
            alert_data["fingerprint"] = fingerprint
            return self.create_current(alert_data)

    def list_current(self, filters: AlertFilterParams) -> tuple[list[AlertCurrent], int]:
        """
        List current alerts with filters and pagination.
        Returns tuple of (alerts, total_count).
        """
        query = self.db.query(AlertCurrent)

        # Apply filters
        if filters.status:
            query = query.filter(AlertCurrent.status == filters.status)
        if filters.severity:
            query = query.filter(AlertCurrent.severity == filters.severity)
        if filters.team:
            query = query.filter(AlertCurrent.team == filters.team)
        if filters.alertname:
            query = query.filter(AlertCurrent.alertname.ilike(f"%{filters.alertname}%"))
        if not filters.show_acked:
            query = query.filter(AlertCurrent.acked == False)
        if not filters.show_silenced:
            query = query.filter(AlertCurrent.silenced == False)

        # Count total before pagination
        total = query.count()

        # Sort: firing first, then by updated_at descending
        query = query.order_by(
            desc(case((AlertCurrent.status == "firing", 1), else_=0)), desc(AlertCurrent.updated_at)
        )

        # Paginate
        alerts = query.offset(filters.offset).limit(filters.limit).all()

        return alerts, total

    def acknowledge(
        self, fingerprint: str, acked_by: str, note: str | None = None
    ) -> AlertCurrent | None:
        """Acknowledge an alert."""
        alert = self.get_current_by_fingerprint(fingerprint)
        if not alert:
            return None

        alert.acked = True
        alert.acked_by = acked_by
        alert.acked_at = datetime.now(timezone.utc)
        alert.ack_note = note

        self.db.commit()
        self.db.refresh(alert)
        return alert

    def unacknowledge(self, fingerprint: str) -> AlertCurrent | None:
        """Remove acknowledgment from an alert."""
        alert = self.get_current_by_fingerprint(fingerprint)
        if not alert:
            return None

        alert.acked = False
        alert.acked_by = None
        alert.acked_at = None
        alert.ack_note = None

        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_stats(self) -> dict:
        """Get alert statistics."""
        total = self.db.query(AlertCurrent).count()

        firing = self.db.query(AlertCurrent).filter(AlertCurrent.status == "firing").count()

        resolved = self.db.query(AlertCurrent).filter(AlertCurrent.status == "resolved").count()

        critical = (
            self.db.query(AlertCurrent)
            .filter(AlertCurrent.severity == "critical", AlertCurrent.status == "firing")
            .count()
        )

        warning = (
            self.db.query(AlertCurrent)
            .filter(AlertCurrent.severity == "warning", AlertCurrent.status == "firing")
            .count()
        )

        info = (
            self.db.query(AlertCurrent)
            .filter(AlertCurrent.severity == "info", AlertCurrent.status == "firing")
            .count()
        )

        acked = self.db.query(AlertCurrent).filter(AlertCurrent.acked == True).count()

        # Stats by team
        by_team = dict(
            self.db.query(func.coalesce(AlertCurrent.team, 'unknown'), func.count(AlertCurrent.id))
            .filter(AlertCurrent.status == "firing")
            .group_by(func.coalesce(AlertCurrent.team, 'unknown'))
            .all()
        )

        # Stats by severity
        by_severity = dict(
            self.db.query(func.coalesce(AlertCurrent.severity, 'unknown'), func.count(AlertCurrent.id))
            .filter(AlertCurrent.status == "firing")
            .group_by(func.coalesce(AlertCurrent.severity, 'unknown'))
            .all()
        )

        return {
            "total": total,
            "firing": firing,
            "resolved": resolved,
            "critical": critical,
            "warning": warning,
            "info": info,
            "acked": acked,
            "by_team": by_team,
            "by_severity": by_severity,
        }

    def create_event(self, event_data: dict) -> AlertEvent:
        """Create an alert event for history."""
        event = AlertEvent(**event_data)
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_events_by_fingerprint(self, fingerprint: str, limit: int = 100) -> list[AlertEvent]:
        """Get event history for a specific alert."""
        return (
            self.db.query(AlertEvent)
            .filter(AlertEvent.fingerprint == fingerprint)
            .order_by(desc(AlertEvent.created_at))
            .limit(limit)
            .all()
        )
