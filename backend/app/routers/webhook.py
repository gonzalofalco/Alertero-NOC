"""
Webhook router for receiving Grafana alerts.
"""

import logging
import re
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AlertCurrent, AlertEvent, Silence
from app.schemas import GrafanaWebhookPayload
from app.utils import extract_severity, extract_team, generate_fingerprint

router = APIRouter()
logger = logging.getLogger(__name__)


def verify_webhook_secret(x_webhook_secret: str = Header(None), authorization: str = Header(None)):
    """
    Verificar autenticación del webhook.
    Soporta dos métodos:
    1. X-Webhook-Secret: <secret>
    2. Authorization: Bearer <secret>
    """
    # Método 1: Custom header X-Webhook-Secret
    if x_webhook_secret and x_webhook_secret == settings.webhook_secret:
        return True

    # Método 2: Authorization Bearer (estándar HTTP)
    if authorization:
        # Formato: "Bearer <token>"
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            if token == settings.webhook_secret:
                return True

    # Si ninguno es válido, denegar
    logger.warning("Webhook authentication failed - invalid credentials")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")
    return True


def parse_grafana_annotations(annotations: dict, labels: dict) -> tuple:
    """
    Parsear annotations de Grafana para extraer summary y description.

    Grafana puede enviar:
    - summary/description en annotations
    - message en annotations (texto largo con info)
    - description en labels con formato especial

    Retorna: (summary, description)
    """
    summary = annotations.get("summary", "")
    description = annotations.get("description", "")
    message = annotations.get("message", "")

    # Si no hay summary, intentar generar uno
    if not summary:
        # Opción 1: Primera línea del message
        if message:
            first_line = message.split("\n")[0].strip("- ").strip()
            if first_line and len(first_line) < 200:
                summary = first_line

        # Opción 2: Usar description de labels (común en alertas de acceso)
        if not summary and "description" in labels:
            label_desc = labels.get("description", "")
            # Extraer info útil del formato ##CR## {0001:OLT:XXX:PO1}
            if "OLT:" in label_desc:
                summary = f"Puerto afectado: {label_desc}"
            else:
                summary = label_desc[:200]

        # Opción 3: Generar desde alertname
        if not summary:
            alertname = labels.get("alertname", "")
            summary = alertname.replace("-", " ").replace("_", " ").title()

    # Si no hay description, usar message
    if not description and message:
        description = message

    return summary, description


def extract_instance_from_labels(labels: dict) -> str:
    """
    Extraer instancia/equipo relevante de los labels.

    Para alertas de Telecentro:
    - cmts (HFC)
    - gebus_elementId (equipos)
    - system_name (FTTH)
    - grupo (FTTH OLTs)
    - instance (default)
    """
    # Orden de prioridad
    instance_keys = [
        "cmts",  # HFC: CA-CBR8-CMTS-8
        "gebus_elementId",  # Equipos generales
        "system_name",  # FTTH: LP-7750SR7s-PE-1
        "grupo",  # FTTH OLT groups
        "instance",  # Default de Grafana
    ]

    for key in instance_keys:
        if key in labels and labels[key] and labels[key] != "null":
            return labels[key]

    return labels.get("instance", "")


def extract_team_from_labels(labels: dict) -> str:
    """
    Extraer team/equipo responsable de los labels.

    Para alertas de Telecentro:
    - oym: acceso_hfc, acceso_ftth, core, transmision
    - team: label estándar
    - noc: indica si es alerta de NOC
    """
    # Si ya tiene team, usarlo
    if "team" in labels and labels["team"]:
        return labels["team"]

    # Extraer de oym (Operation & Maintenance)
    if "oym" in labels and labels["oym"]:
        oym = labels["oym"]
        # Convertir acceso_hfc -> HFC, acceso_ftth -> FTTH, etc.
        if "acceso_hfc" in oym:
            return "Acceso HFC"
        elif "acceso_ftth" in oym:
            return "Acceso FTTH"
        elif "core" in oym:
            return "Core"
        elif "transmision" in oym:
            return "Transmisión"
        else:
            return oym.replace("_", " ").title()

    # Si es alerta de NOC
    if labels.get("noc") == "true" or labels.get("noc_acceso") == "true":
        return "NOC"

    # Fallback
    return None


@router.post("/webhook/grafana", status_code=status.HTTP_202_ACCEPTED)
async def grafana_webhook(
    payload: GrafanaWebhookPayload,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_webhook_secret),
):
    """
    Recibir alertas de Grafana y procesarlas.

    Para cada alerta en el payload:
    1. Generar fingerprint único
    2. Parsear annotations para extraer info útil
    3. Verificar si está silenciada
    4. UPSERT en alerts_current (mantener estado actual)
    5. INSERT en alert_events (historial completo)
    """
    processed = []

    for alert in payload.alerts:
        try:
            # Generar fingerprint único basado en labels
            fingerprint = generate_fingerprint(alert.labels)

            # Extraer severity
            severity = extract_severity(alert.labels)

            # Parsear annotations para obtener summary/description útiles
            summary, description = parse_grafana_annotations(alert.annotations, alert.labels)

            # Extraer instance relevante (equipo/cmts/olt)
            instance = extract_instance_from_labels(alert.labels)

            # Extraer team (oym, noc, etc.)
            team = extract_team_from_labels(alert.labels)
            if not team:
                team = extract_team(alert.labels)  # Fallback a función original

            # Verificar si está silenciada
            is_silenced = is_alert_silenced(db, alert.labels)

            # Preparar datos comunes
            alert_data = {
                "fingerprint": fingerprint,
                "starts_at": alert.startsAt,
                "ends_at": alert.endsAt if alert.endsAt.year != 1 else None,
                "status": alert.status,
                "severity": severity,
                "alertname": alert.labels.get("alertname", "unknown"),
                "instance": instance,
                "team": team,
                "summary": summary,
                "description": description,
                "labels": alert.labels,
                "annotations": alert.annotations,
                "generator_url": alert.generatorURL,
                "silenced": is_silenced,
                "updated_at": datetime.utcnow(),
            }

            # UPSERT en alerts_current (tabla de estado)
            alert_current = (
                db.query(AlertCurrent).filter(AlertCurrent.fingerprint == fingerprint).first()
            )

            if alert_current:
                # UPDATE - preservar ACK si ya existe
                for key, value in alert_data.items():
                    if key != "fingerprint":  # No cambiar PK
                        setattr(alert_current, key, value)
                logger.info(f"Updated alert {fingerprint[:12]} status={alert.status}")
            else:
                # INSERT
                alert_current = AlertCurrent(**alert_data)
                db.add(alert_current)
                logger.info(f"Created new alert {fingerprint[:12]} status={alert.status}")

            # INSERT en alert_events (historial append-only)
            alert_event = AlertEvent(
                fingerprint=fingerprint,
                event_type="webhook",
                status=alert.status,
                severity=severity,
                alertname=alert_data["alertname"],
                instance=instance,
                team=team,
                summary=summary,
                description=description,
                labels=alert.labels,
                annotations=alert.annotations,
                generator_url=alert.generatorURL,
                raw=alert.model_dump(mode="json"),
            )
            db.add(alert_event)

            db.commit()
            processed.append(fingerprint)

        except Exception as e:
            db.rollback()
            logger.error(f"Error processing alert: {e}", exc_info=True)
            # Continuar con siguiente alerta

    return {
        "message": f"Processed {len(processed)} alerts",
        "fingerprints": [fp[:12] for fp in processed],
    }


def is_alert_silenced(db: Session, labels: dict) -> bool:
    """
    Verificar si la alerta coincide con alguna regla de silencio activa.

    Un silencio tiene matchers (key-value pairs o regex).
    La alerta está silenciada si TODOS los matchers de AL MENOS UN silencio coinciden.
    """
    now = datetime.utcnow()
    active_silences = (
        db.query(Silence).filter(Silence.active == True, Silence.expires_at > now).all()
    )

    for silence in active_silences:
        if all_matchers_match(silence.matchers, labels):
            logger.info(f"Alert silenced by rule: {silence.comment}")
            return True

    return False


def all_matchers_match(matchers: list, labels: dict) -> bool:
    """
    Verificar si TODOS los matchers coinciden con los labels.

    Matcher format: {"name": "alertname", "value": "HighCPU", "isRegex": false}
    """
    for matcher in matchers:
        name = matcher.get("name")
        value = matcher.get("value")
        is_regex = matcher.get("isRegex", False)

        if name not in labels:
            return False

        label_value = labels[name]

        if is_regex:
            try:
                if not re.match(value, label_value):
                    return False
            except re.error:
                logger.warning(f"Invalid regex in matcher: {value}")
                return False
        else:
            if label_value != value:
                return False

    return True
