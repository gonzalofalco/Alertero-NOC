"""
Configuración centralizada de la aplicación usando Pydantic Settings.
Lee variables de entorno y valida tipos.
"""

import secrets
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación con validación de tipos."""

    # Application
    app_name: str = "Alertero API"
    app_version: str = "1.0.0"
    environment: Literal["development", "staging", "production", "test"] = "production"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_pre_ping: bool = True
    db_echo: bool = False

    # Security
    webhook_secret: str
    secret_key: str = secrets.token_urlsafe(32)

    # CORS
    cors_origins: list[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # API
    api_v1_prefix: str = "/api/v1"
    api_legacy_prefix: str = "/api"

    # Pagination
    default_page_size: int = 100
    max_page_size: int = 2000

    # Alerting
    alert_retention_days: int = 90
    event_retention_days: int = 365

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"

    @property
    def is_test(self) -> bool:
        """Check if running in test mode."""
        return self.environment == "test"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Use this function to access settings throughout the application.
    """
    return Settings()


# Global settings instance
settings = get_settings()
