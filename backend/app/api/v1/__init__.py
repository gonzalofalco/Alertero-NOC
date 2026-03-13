"""API v1 package."""

from fastapi import APIRouter

from app.api.v1.routers import alerts, health, incidents, maintenance, silences, webhook

# Create API v1 router
api_router = APIRouter()

# Include all v1 routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(webhook.router, tags=["webhook"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(silences.router, tags=["silences"])
api_router.include_router(maintenance.router, tags=["maintenance"])
api_router.include_router(incidents.router, tags=["incidents"])

__all__ = ["api_router"]
