"""
FastAPI main application.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

import sqlalchemy
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine
from app.routers import alerts, health, maintenance, silences, webhook

# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting Alertero API")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {settings.database_url.split('@')[-1]}")  # No loguear credenciales

    # Verificar conexión a BD (las tablas se crean con Alembic)
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
        logger.info("Database connection OK")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

    yield

    logger.info("Shutting down Alertero API")


app = FastAPI(
    title="Alertero API",
    description="Enterprise Grafana Alerting Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(webhook.router, prefix="/api", tags=["webhook"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(silences.router, prefix="/api", tags=["silences"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(maintenance.router, prefix="/api", tags=["maintenance"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Alertero API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }
