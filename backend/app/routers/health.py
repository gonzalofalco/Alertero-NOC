import sqlalchemy

"""
Health check router.
"""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint para monitoreo.

    Verifica:
    - API está respondiendo
    - Conexión a base de datos funciona
    """
    db_healthy = "error"

    try:
        # Test DB connection
        db.execute(sqlalchemy.text("SELECT 1"))
        db_healthy = "ok"
    except Exception:
        pass

    status_str = "healthy" if db_healthy else "unhealthy"

    return HealthResponse(
        status=status_str,
        timestamp=datetime.utcnow(),
        database=db_healthy,
        environment=settings.environment,
    )


@router.get("/health/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness probe para Kubernetes/Docker.

    Retorna 200 si está listo para recibir tráfico.
    """
    try:
        db.execute(sqlalchemy.text("SELECT 1"))
        return {"ready": True}
    except Exception:
        # Si DB no está disponible, no estamos ready
        from fastapi import HTTPException

        raise HTTPException(status_code=503, detail="Database not available")


@router.get("/health/live")
async def liveness_check():
    """
    Liveness probe para Kubernetes/Docker.

    Siempre retorna 200 mientras el proceso esté vivo.
    """
    return {"alive": True}
