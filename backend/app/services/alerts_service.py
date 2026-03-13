"""
Service layer for alert business logic.
"""

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.repositories.alerts_repo import AlertRepository
from app.repositories.silences_repo import SilenceRepository
from app.schemas.alert import (
    AlertAckRequest,
    AlertCurrentResponse,
    AlertFilterParams,
    AlertStatsResponse,
    GrafanaWebhookPayload,
)
from app.utils.alerts import (
    extract_instance,
    extract_severity,
    extract_team,
    generate_fingerprint,
    make_aware_utc,
    match_silence_matchers,
    parse_annotations,
)

logger = get_logger(__name__)


class AlertService:
    """Service for alert business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.alert_repo = AlertRepository(db)
        self.silence_repo = SilenceRepository(db)

    def process_webhook(self, payload: GrafanaWebhookPayload) -> tuple[int, list[str]]:
        """
        Process Grafana webhook payload.

        For each alert in payload:
        1. Generate unique fingerprint
        2. Parse annotations to extract useful info
        3. Check if it's silenced
        4. UPSERT in alerts_current (maintain current state)
        5. INSERT in alert_events (complete history)

        Returns: (processed_count, fingerprints)
        """
        processed_fingerprints = []

        for alert in payload.alerts:
            try:
                # Generate unique fingerprint based on labels
                fingerprint = generate_fingerprint(alert.labels)

                # Extract severity
                severity = extract_severity(alert.labels)

                # Parse annotations to get useful summary/description
                summary, description = parse_annotations(alert.annotations, alert.labels)

                # Extract relevant instance (equipment/cmts/olt)
                instance = extract_instance(alert.labels)

                # Extract team (oym, noc, etc.)
                team = extract_team(alert.labels)

                # Check if it's silenced
                is_silenced = self._is_alert_silenced(alert.labels)

                # Prepare common data
                alert_data = {
                    "status": alert.status,
                    "severity": severity,
                    "alertname": alert.labels.get("alertname", "unknown"),
                    "instance": instance,
                    "team": team,
                    "starts_at": alert.startsAt,
                    "ends_at": alert.endsAt if alert.endsAt and alert.endsAt.year != 1 else None,
                    "summary": summary,
                    "description": description,
                    "labels": alert.labels,
                    "annotations": alert.annotations,
                    "generator_url": alert.generatorURL,
                    "silenced": is_silenced,
                    "raw": alert.model_dump(mode="json"),
                }

                # UPSERT in alerts_current (state table)
                existing_alert = self.alert_repo.get_current_by_fingerprint(fingerprint)

                if existing_alert:
                    # UPDATE - preserve ACK if already exists
                    # Don't overwrite ack fields
                    update_data = {k: v for k, v in alert_data.items()}
                    self.alert_repo.update_current(existing_alert, update_data)
                    logger.info(f"Updated alert {fingerprint[:12]} status={alert.status}")
                else:
                    # INSERT
                    alert_data["fingerprint"] = fingerprint
                    self.alert_repo.create_current(alert_data)
                    logger.info(f"Created new alert {fingerprint[:12]} status={alert.status}")

                # INSERT in alert_events (append-only history)
                event_data = {
                    "fingerprint": fingerprint,
                    "event_type": "webhook",
                    **{k: v for k, v in alert_data.items() if k != "raw"},
                }
                self.alert_repo.create_event(event_data)

                processed_fingerprints.append(fingerprint)

            except Exception as e:
                logger.error(f"Error processing alert: {e}", exc_info=True)
                # Continue with next alert

        return len(processed_fingerprints), processed_fingerprints

    def _is_alert_silenced(self, labels: dict) -> bool:
        """
        Check if alert matches any active silence rule.

        A silence has matchers (key-value pairs or regex).
        An alert is silenced if ALL matchers of AT LEAST ONE silence match.
        """
        active_silences = self.silence_repo.list_active()

        for silence in active_silences:
            if match_silence_matchers(silence.matchers, labels):
                logger.info(f"Alert silenced by rule {silence.id}")
                return True

        return False

    def list_current_alerts(
        self, filters: AlertFilterParams
    ) -> tuple[list[AlertCurrentResponse], int]:
        """
        List current alerts with filters and pagination.

        Returns: (alerts, total_count)
        """
        alerts, total = self.alert_repo.list_current(filters)

        # Convert to response models with timezone-aware datetimes
        alert_responses = []
        for alert in alerts:
            alert.updated_at = make_aware_utc(alert.updated_at)
            alert.acked_at = make_aware_utc(alert.acked_at)
            alert.starts_at = make_aware_utc(alert.starts_at)
            alert.ends_at = make_aware_utc(alert.ends_at)
            alert_responses.append(AlertCurrentResponse.model_validate(alert))

        return alert_responses, total

    def acknowledge_alert(
        self, fingerprint: str, ack_request: AlertAckRequest
    ) -> AlertCurrentResponse | None:
        """Acknowledge an alert."""
        alert = self.alert_repo.acknowledge(fingerprint, ack_request.acked_by, ack_request.note)

        if not alert:
            return None

        # Convert timestamps
        alert.updated_at = make_aware_utc(alert.updated_at)
        alert.acked_at = make_aware_utc(alert.acked_at)
        alert.starts_at = make_aware_utc(alert.starts_at)
        alert.ends_at = make_aware_utc(alert.ends_at)

        return AlertCurrentResponse.model_validate(alert)

    def unacknowledge_alert(self, fingerprint: str) -> AlertCurrentResponse | None:
        """Remove acknowledgment from an alert."""
        alert = self.alert_repo.unacknowledge(fingerprint)

        if not alert:
            return None

        # Convert timestamps
        alert.updated_at = make_aware_utc(alert.updated_at)
        alert.starts_at = make_aware_utc(alert.starts_at)
        alert.ends_at = make_aware_utc(alert.ends_at)

        return AlertCurrentResponse.model_validate(alert)

    def get_alert_stats(self) -> AlertStatsResponse:
        """Get alert statistics."""
        stats = self.alert_repo.get_stats()
        return AlertStatsResponse(**stats)
