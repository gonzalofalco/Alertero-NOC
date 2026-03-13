"""
Database models for silences.
"""

from sqlalchemy import JSON, Boolean, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class Silence(Base):
    """
    Configurable local silences for alerts.
    """

    __tablename__ = "silences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Matchers: [{"label": "alertname", "value": "HighCPU", "is_regex": false}]
    matchers = Column(JSON, nullable=False)

    created_by = Column(String(255), nullable=False)
    note = Column(Text)
    active = Column(Boolean, default=True, index=True)

    __table_args__ = (Index("ix_silences_active_expires", "active", "expires_at"),)

    def __repr__(self) -> str:
        return f"<Silence id={self.id} active={self.active}>"
