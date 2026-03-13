"""
Maintenance router - Auto-resolve stale alerts.
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/maintenance/auto-resolve-stale")
async def auto_resolve_stale_alerts(
    hours_threshold: int = Query(12, description="Horas sin update para considerar stale"),
    dry_run: bool = Query(False, description="Solo mostrar, no ejecutar"),
    db: Session = Depends(get_db),
):
    """
    Auto-resolver alertas "firing" que no han recibido updates de Grafana
    en las últimas X horas (probablemente ya se resolvieron pero Grafana
    no envió el webhook de resolved).

    Por defecto: 12 horas sin update = auto-resolve
    """

    # Buscar alertas stale (sin updates recientes)
    threshold = datetime.utcnow() - timedelta(hours=hours_threshold)

    query = text("""
        SELECT 
            fingerprint,
            alertname,
            instance,
            starts_at,
            updated_at,
            NOW() - updated_at as tiempo_sin_update
        FROM alerts_current
        WHERE status = 'firing'
          AND updated_at < :threshold
        ORDER BY updated_at ASC
    """)

    result = db.execute(query, {"threshold": threshold})
    stale_alerts = result.fetchall()

    resolved_count = 0
    alerts_info = []

    for alert in stale_alerts:
        fingerprint, alertname, instance, starts_at, updated_at, tiempo_sin_update = alert

        info = {
            "fingerprint": fingerprint[:12],
            "alertname": alertname,
            "instance": instance or "N/A",
            "starts_at": str(starts_at),
            "updated_at": str(updated_at),
            "hours_stale": str(tiempo_sin_update).split(".")[0],
        }
        alerts_info.append(info)

        if not dry_run:
            # Marcar como resolved
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
                f"Auto-resolved stale alert: {alertname} ({fingerprint[:12]}) - {tiempo_sin_update} sin update"
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
    hours_threshold: int = Query(12, description="Horas sin update para considerar stale"),
    db: Session = Depends(get_db),
):
    """
    Solo consultar cuántas alertas están stale (sin ejecutar auto-resolve).
    """
    threshold = datetime.utcnow() - timedelta(hours=hours_threshold)

    query = text("""
        SELECT 
            COUNT(*) as total,
            MIN(updated_at) as mas_antigua,
            MAX(NOW() - updated_at) as max_tiempo_stale
        FROM alerts_current
        WHERE status = 'firing'
          AND updated_at < :threshold
    """)

    result = db.execute(query, {"threshold": threshold}).fetchone()
    total, mas_antigua, max_tiempo_stale = result

    return {
        "threshold_hours": hours_threshold,
        "stale_alerts_count": total,
        "oldest_update": str(mas_antigua) if mas_antigua else None,
        "max_hours_without_update": (
            str(max_tiempo_stale).split(".")[0] if max_tiempo_stale else None
        ),
    }
