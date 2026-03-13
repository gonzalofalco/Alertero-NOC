"""
Tests for health endpoint.
"""

import pytest
from fastapi import status


def test_health_check(client):
    """Test health check endpoint returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "timestamp" in data
    assert "version" in data
    assert "environment" in data


def test_health_check_legacy_route(client):
    """Test health check on legacy /api prefix."""
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "api" in data
