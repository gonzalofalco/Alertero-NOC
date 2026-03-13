"""
Maintenance router - Auto-resolve stale alerts.
"""

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.dependencies import get_db

router = APIRouter()
logger = get_logger(__name__)


@router.post("/maintenance/auto-resolve-stale")
async def auto_resolve_stale_alerts(
    hours_threshold: int = Query(12, description="Hours without update to consider stale"),
    dry_run: bool = Query(False, description="Only show, don't execute"),
    db: Session = Depends(get_db),
):
    """
    Auto-resolve 'firing' alerts that haven't received updates from Grafana
    in the last X hours (probably already resolved but Grafana
    didn't send the resolved webhook).

    Default: 12 hours without update = auto-resolve
    """

    # Find stale alerts (without recent updates)
    threshold = datetime.utcnow() - timedelta(hours=hours_threshold)

    query = text("""
        SELECT 
            fingerprint,
            alertname,
            instance,
            starts_at,
            updated_at,
            NOW() - updated_at as time_stale
        FROM alerts_current
        WHERE status = 'firing'
          AND updated_at < :threshold
        ORDER BY updated_at ASC
    """)

    result = db.execute(query, {"threshold": threshold})
    stale_alerts = result.fetchall()

    resolved_count = 0
    alerts_info: list[dict[str, Any]] = []

    for alert in stale_alerts:
        fingerprint, alertname, instance, starts_at, updated_at, time_stale = alert

        info = {
            "fingerprint": fingerprint[:12],
            "alertname": alertname,
            "instance": instance or "N/A",
            "starts_at": str(starts_at),
            "updated_at": str(updated_at),
            "hours_stale": str(time_stale).split(".")[0],
        }
        alerts_info.append(info)

        if not dry_run:
            # Mark as resolved
            update_query = text("""
                UPDATE alerts_current
                SET status = 'resolved',
                    ends_at = NOW(),
                    updated_at = NOW()
                WHERE fingerprint = :fingerprint
            """)
            db.execute(update_query, {"fingerprint": fingerprint})
            resolved_count += 1

            logger.info(
                f"Auto-resolved stale alert: {alertname} ({fingerprint[:12]}) - "
                f"{time_stale} without update"
            )

    if not dry_run and resolved_count > 0:
        db.commit()

    return {
        "status": "dry-run" if dry_run else "completed",
        "threshold_hours": hours_threshold,
        "stale_alerts_found": len(stale_alerts),
        "resolved_count": resolved_count if not dry_run else 0,
        "alerts": alerts_info,
    }


@router.get("/maintenance/check-stale")
async def check_stale_alerts(
    hours_threshold: int = Query(12, description="Hours without update to consider stale"),
    db: Session = Depends(get_db),
):
    """
    Only check how many alerts are stale (without executing auto-resolve).
    """
    threshold = datetime.utcnow() - timedelta(hours=hours_threshold)

    query = text("""
        SELECT COUNT(*) as count
        FROM alerts_current
        WHERE status = 'firing'
          AND updated_at < :threshold
    """)

    result = db.execute(query, {"threshold": threshold})
    count = result.scalar()

    return {"threshold_hours": hours_threshold, "stale_alerts_count": count}
