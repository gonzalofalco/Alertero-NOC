"""
Alerts CRUD router.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AlertCurrent, AlertEvent
from app.schemas import AlertAckRequest, AlertEventResponse, AlertListResponse

router = APIRouter()


def make_aware_utc(dt):
    """Convierte datetime naive a UTC timezone-aware"""
    if dt and dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


@router.get("/alerts/current", response_model=AlertListResponse)
async def list_current_alerts(
    status_filter: str | None = Query(None, description="firing|resolved"),
    severity: str | None = Query(None, description="critical|warning|info"),
    team: str | None = Query(None),
    alertname: str | None = Query(None),
    show_acked: bool = Query(True, description="Incluir alertas reconocidas"),
    show_silenced: bool = Query(False, description="Incluir alertas silenciadas"),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Listar alertas actuales (alerts_current) con filtros.
    """
    query = db.query(AlertCurrent)

    # Filtros
    if status_filter:
        query = query.filter(AlertCurrent.status == status_filter)
    if severity:
        query = query.filter(AlertCurrent.severity == severity)
    if team:
        query = query.filter(AlertCurrent.team == team)
    if alertname:
        query = query.filter(AlertCurrent.alertname.ilike(f"%{alertname}%"))
    if not show_acked:
        query = query.filter(AlertCurrent.acked == False)

    # Ordenamiento: firing primero, luego por updated_at descendente
    query = query.order_by(
        desc(case((AlertCurrent.status == "firing", 1), else_=0)), desc(AlertCurrent.updated_at)
    )

    # Contar total
    total = query.count()

    # Paginación
    alerts = query.offset(offset).limit(limit).all()

    # Convertir fechas a UTC timezone-aware
    for alert in alerts:
        alert.updated_at = make_aware_utc(alert.updated_at)
        alert.acked_at = make_aware_utc(alert.acked_at)

    return {"total": total, "limit": limit, "offset": offset, "items": alerts}


@router.post("/alerts/current/{fingerprint}/ack")
async def acknowledge_alert(
    fingerprint: str, ack_data: AlertAckRequest, db: Session = Depends(get_db)
):
    """
    Reconocer (acknowledge) una alerta.
    """
    alert = db.query(AlertCurrent).filter(AlertCurrent.fingerprint == fingerprint).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acked = True
    alert.acked_by = ack_data.acked_by
    alert.acked_at = datetime.utcnow()
    alert.ack_note = ack_data.note

    db.commit()
    db.refresh(alert)

    # Convertir fechas a UTC timezone-aware
    alert.updated_at = make_aware_utc(alert.updated_at)
    alert.acked_at = make_aware_utc(alert.acked_at)

    return alert


@router.delete("/alerts/current/{fingerprint}/ack")
async def unacknowledge_alert(fingerprint: str, db: Session = Depends(get_db)):
    """
    Quitar reconocimiento de una alerta.
    """
    alert = db.query(AlertCurrent).filter(AlertCurrent.fingerprint == fingerprint).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acked = False
    alert.acked_by = None
    alert.acked_at = None
    alert.ack_note = None

    db.commit()
    db.refresh(alert)

    # Convertir fechas a UTC timezone-aware
    alert.updated_at = make_aware_utc(alert.updated_at)

    return alert


@router.get("/alerts/stats")
async def get_alert_stats(db: Session = Depends(get_db)):
    """
    Obtener estadísticas de alertas.
    """
    total = db.query(AlertCurrent).count()

    critical = (
        db.query(AlertCurrent)
        .filter(AlertCurrent.severity == "critical", AlertCurrent.status == "firing")
        .count()
    )

    warning = (
        db.query(AlertCurrent)
        .filter(AlertCurrent.severity == "warning", AlertCurrent.status == "firing")
        .count()
    )

    firing = db.query(AlertCurrent).filter(AlertCurrent.status == "firing").count()
    resolved = db.query(AlertCurrent).filter(AlertCurrent.status == "resolved").count()
    acked = db.query(AlertCurrent).filter(AlertCurrent.acked == True).count()

    return {
        "total": total,
        "critical": critical,
        "warning": warning,
        "firing": firing,
        "resolved": resolved,
        "acked": acked,
        "total_firing": firing,
    }


@router.get("/alerts/history", response_model=list[AlertEventResponse])
async def list_alert_history(
    fingerprint: str | None = Query(None),
    alertname: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Listar historial de eventos de alertas.
    """
    query = db.query(AlertEvent)

    if fingerprint:
        query = query.filter(AlertEvent.fingerprint == fingerprint)
    if alertname:
        query = query.filter(AlertEvent.labels["alertname"].astext.ilike(f"%{alertname}%"))

    events = query.order_by(desc(AlertEvent.received_at)).limit(limit).all()

    # Convertir fechas a UTC timezone-aware
    for event in events:
        event.received_at = make_aware_utc(event.received_at)
        event.starts_at = make_aware_utc(event.starts_at)
        event.ends_at = make_aware_utc(event.ends_at)

    return events
