"""
FastAPI main application with enhanced architecture.
"""

import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import sqlalchemy
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router as api_v1_router
from app.core.config import settings
from app.core.logging import get_logger, request_id_var, setup_logging
from app.db.session import engine

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"Starting {settings.app_name}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Version: {settings.app_version}")

    # Verify database connection (tables are created with Alembic)
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
        logger.info("Database connection OK")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

    yield

    logger.info(f"Shutting down {settings.app_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Enterprise Grafana Alerting Dashboard with Clean Architecture",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)


# Middleware: Request ID tracking
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Add request ID to context for logging."""
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_var.set(req_id)

    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)


# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

# BACKWARD COMPATIBILITY: Mount legacy /api routes
# This allows existing integrations to continue working
app.include_router(
    api_v1_router,
    prefix=settings.api_legacy_prefix,
    include_in_schema=False,  # Don't show in docs to encourage v1 usage
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "request_id": request_id_var.get()},
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "api": {
            "v1": settings.api_v1_prefix,
            "legacy": settings.api_legacy_prefix,
            "docs": "/docs" if settings.is_development else None,
        },
    }
