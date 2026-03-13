"""
Silences management router.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Silence
from app.schemas import SilenceCreateRequest, SilenceResponse

router = APIRouter()


@router.get("/silences", response_model=list[SilenceResponse])
async def list_silences(
    active_only: bool = Query(True, description="Solo reglas activas"),
    db: Session = Depends(get_db),
):
    """Listar reglas de silencio"""
    query = db.query(Silence)

    if active_only:
        query = query.filter(Silence.active == True, Silence.expires_at > datetime.utcnow())

    silences = query.order_by(Silence.created_at.desc()).all()
    return [SilenceResponse.model_validate(s) for s in silences]


@router.post("/silences", response_model=SilenceResponse, status_code=status.HTTP_201_CREATED)
async def create_silence(silence_data: SilenceCreateRequest, db: Session = Depends(get_db)):
    """
    Crear regla de silencio.

    Los matchers definen qué alertas se silencian.
    Ejemplo: [{"name": "alertname", "value": "HighCPU", "isRegex": false}]

    Todas las alertas que coincidan con TODOS los matchers serán silenciadas.
    """
    silence = Silence(
        matchers=silence_data.matchers,
        expires_at=silence_data.expires_at,
        created_by=silence_data.created_by,
        comment=silence_data.comment or "",
        active=True,
    )

    db.add(silence)
    db.commit()
    db.refresh(silence)

    return SilenceResponse.model_validate(silence)


@router.delete("/silences/{silence_id}", status_code=status.HTTP_200_OK)
async def delete_silence(silence_id: int, db: Session = Depends(get_db)):
    """Eliminar (desactivar) regla de silencio"""
    silence = db.query(Silence).filter(Silence.id == silence_id).first()
    if not silence:
        raise HTTPException(status_code=404, detail="Silence not found")

    silence.active = False
    db.commit()

    return {"message": "Silence deactivated"}


@router.put("/silences/{silence_id}/extend", response_model=SilenceResponse)
async def extend_silence(silence_id: int, new_expires_at: datetime, db: Session = Depends(get_db)):
    """Extender tiempo de expiración de un silencio"""
    silence = db.query(Silence).filter(Silence.id == silence_id).first()
    if not silence:
        raise HTTPException(status_code=404, detail="Silence not found")

    if new_expires_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="New expiration must be in the future")

    silence.expires_at = new_expires_at
    db.commit()
    db.refresh(silence)

    return SilenceResponse.model_validate(silence)
