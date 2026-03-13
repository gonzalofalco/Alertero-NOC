"""
Alerts CRUD router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.dependencies import get_db
from app.schemas.alert import (
    AlertAckRequest,
    AlertCurrentResponse,
    AlertFilterParams,
    AlertListResponse,
    AlertStatsResponse,
)
from app.services.alerts_service import AlertService

router = APIRouter()
logger = get_logger(__name__)


@router.get("/alerts/current", response_model=AlertListResponse)
async def list_current_alerts(
    status_filter: str | None = Query(None, description="firing|resolved", alias="status"),
    severity: str | None = Query(None, description="critical|warning|info"),
    team: str | None = Query(None),
    alertname: str | None = Query(None),
    show_acked: bool = Query(True, description="Include acknowledged alerts"),
    show_silenced: bool = Query(False, description="Include silenced alerts"),
    limit: int = Query(100, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    List current alerts (alerts_current) with filters.
    """
    service = AlertService(db)

    filters = AlertFilterParams(
        status=status_filter,
        severity=severity,
        team=team,
        alertname=alertname,
        show_acked=show_acked,
        show_silenced=show_silenced,
        limit=limit,
        offset=offset,
    )

    alerts, total = service.list_current_alerts(filters)

    return AlertListResponse(total=total, limit=limit, offset=offset, items=alerts)


@router.post(
    "/alerts/current/{fingerprint}/ack",
    response_model=AlertCurrentResponse,
    status_code=status.HTTP_200_OK,
)
async def acknowledge_alert(
    fingerprint: str, ack_data: AlertAckRequest, db: Session = Depends(get_db)
):
    """
    Acknowledge an alert.
    """
    service = AlertService(db)
    alert = service.acknowledge_alert(fingerprint, ack_data)

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return alert


@router.delete(
    "/alerts/current/{fingerprint}/ack",
    response_model=AlertCurrentResponse,
    status_code=status.HTTP_200_OK,
)
async def unacknowledge_alert(fingerprint: str, db: Session = Depends(get_db)):
    """
    Remove acknowledgment from an alert.
    """
    service = AlertService(db)
    alert = service.unacknowledge_alert(fingerprint)

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return alert


@router.get("/alerts/stats", response_model=AlertStatsResponse)
async def get_alert_stats(db: Session = Depends(get_db)):
    """
    Get alert statistics.
    """
    service = AlertService(db)
    return service.get_alert_stats()
