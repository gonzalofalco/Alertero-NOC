"""
SQLAlchemy base class and common utilities.
"""

from sqlalchemy.orm import DeclarativeMeta, declarative_base

# Base class for all models
Base: DeclarativeMeta = declarative_base()

# Type annotation for model metadata
metadata = Base.metadata
