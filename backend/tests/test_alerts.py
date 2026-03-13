"""
Tests for alert endpoints.
"""

import pytest
from fastapi import status
from datetime import datetime, timezone, timedelta


def test_list_alerts_empty(client):
    """Test listing alerts when database is empty."""
    response = client.get("/api/v1/alerts/current")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_alert_stats_empty(client):
    """Test alert stats when database is empty."""
    response = client.get("/api/v1/alerts/stats")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["total"] == 0
    assert data["firing"] == 0
    assert data["resolved"] == 0


def test_webhook_authentication_required(client):
    """Test webhook requires authentication."""
    payload = {
        "receiver": "test",
        "status": "firing",
        "alerts": [],
        "groupLabels": {},
        "commonLabels": {},
        "commonAnnotations": {},
        "externalURL": "http://grafana.local",
    }

    response = client.post("/api/v1/webhook/grafana", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_webhook_process_alert(client, webhook_headers, db_session):
    """Test processing alert through webhook."""
    payload = {
        "receiver": "test",
        "status": "firing",
        "alerts": [
            {
                "status": "firing",
                "labels": {
                    "alertname": "TestAlert",
                    "severity": "critical",
                    "instance": "test-server-01",
                },
                "annotations": {
                    "summary": "Test alert summary",
                    "description": "Test alert description",
                },
                "startsAt": datetime.now(timezone.utc).isoformat(),
                "endsAt": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
                "generatorURL": "http://grafana.local/alert/1",
            }
        ],
        "groupLabels": {},
        "commonLabels": {},
        "commonAnnotations": {},
        "externalURL": "http://grafana.local",
    }

    response = client.post("/api/v1/webhook/grafana", json=payload, headers=webhook_headers)
    assert response.status_code == status.HTTP_202_ACCEPTED

    data = response.json()
    assert data["status"] == "success"
    assert data["processed_alerts"] == 1
    assert len(data["fingerprints"]) == 1

    # Verify alert was created
    response = client.get("/api/v1/alerts/current")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["alertname"] == "TestAlert"
    assert data["items"][0]["status"] == "firing"


def test_acknowledge_alert(client, webhook_headers, db_session):
    """Test acknowledging an alert."""
    # First create an alert
    payload = {
        "receiver": "test",
        "status": "firing",
        "alerts": [
            {
                "status": "firing",
                "labels": {"alertname": "TestAlert", "severity": "warning"},
                "annotations": {},
                "startsAt": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "groupLabels": {},
        "commonLabels": {},
        "commonAnnotations": {},
        "externalURL": "http://grafana.local",
    }

    response = client.post("/api/v1/webhook/grafana", json=payload, headers=webhook_headers)
    assert response.status_code == status.HTTP_202_ACCEPTED

    fingerprint = response.json()["fingerprints"][0]

    # Now acknowledge it
    ack_payload = {"acked_by": "test_user", "note": "Working on it"}

    # Need to get full fingerprint from DB
    response = client.get("/api/v1/alerts/current")
    full_fingerprint = response.json()["items"][0]["fingerprint"]

    response = client.post(f"/api/v1/alerts/current/{full_fingerprint}/ack", json=ack_payload)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["acked"] is True
    assert data["acked_by"] == "test_user"
    assert data["ack_note"] == "Working on it"


def test_alert_not_found(client):
    """Test 404 when alert doesn't exist."""
    response = client.post("/api/v1/alerts/current/nonexistent/ack", json={"acked_by": "test"})
    assert response.status_code == status.HTTP_404_NOT_FOUND
