"""
Webhook router for receiving Grafana alerts.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.dependencies import get_db
from app.schemas.alert import GrafanaWebhookPayload
from app.schemas.common import WebhookResponse
from app.services.alerts_service import AlertService

router = APIRouter()
logger = get_logger(__name__)


def verify_webhook_secret(x_webhook_secret: str = Header(None), authorization: str = Header(None)):
    """
    Verify webhook authentication.
    Supports two methods:
    1. X-Webhook-Secret: <secret>
    2. Authorization: Bearer <secret>
    """
    # Method 1: Custom header X-Webhook-Secret
    if x_webhook_secret and x_webhook_secret == settings.webhook_secret:
        return True

    # Method 2: Authorization Bearer (standard HTTP)
    if authorization:
        # Format: "Bearer <token>"
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            if token == settings.webhook_secret:
                return True

    # If neither is valid, deny
    logger.warning("Webhook authentication failed - invalid credentials")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")


@router.post(
    "/webhook/grafana", response_model=WebhookResponse, status_code=status.HTTP_202_ACCEPTED
)
async def grafana_webhook(
    payload: GrafanaWebhookPayload,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_webhook_secret),
):
    """
    Receive alerts from Grafana and process them.

    For each alert in the payload:
    1. Generate unique fingerprint
    2. Parse annotations to extract useful info
    3. Check if it's silenced
    4. UPSERT in alerts_current (maintain current state)
    5. INSERT in alert_events (complete history)
    """
    service = AlertService(db)

    count, fingerprints = service.process_webhook(payload)

    return WebhookResponse(
        status="success",
        processed_alerts=count,
        fingerprints=[fp[:12] for fp in fingerprints],
        message=f"Processed {count} alerts",
    )
