"""
Configuración de la aplicación usando Pydantic Settings.
Lee variables de entorno y valida tipos.
"""

from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # Database
    database_url: str

    # Security
    webhook_secret: str

    # Application
    environment: Literal["development", "production"] = "production"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # CORS (opcional, si necesitas acceder desde otro dominio)
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
