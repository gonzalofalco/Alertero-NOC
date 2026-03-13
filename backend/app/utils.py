"""
Utilidades: fingerprinting, helpers, etc.
"""

import hashlib
import json
from datetime import datetime
from typing import Any


def generate_fingerprint(labels: dict[str, Any]) -> str:
    """
    Genera un fingerprint estable SHA256 basado en labels ESENCIALES.

    Solo usa labels que realmente identifican la alerta de forma única,
    ignorando flags de configuración (gebus, noc_acceso, cgs) que pueden
    cambiar entre actualizaciones de Grafana.

    Labels esenciales para identificar una alerta única:
    - alertname: nombre de la regla
    - instance/cmts/system_name/grupo: equipo afectado
    - description/port_port_id: detalle específico del problema
    - HUB/region: ubicación geográfica
    """
    # Labels que NO deben afectar el fingerprint (flags de config, metadata)
    exclude_labels = {
        "__name__",
        "__tenant_id__",  # Internos de Grafana
        "gebus",
        "cgs",
        "noc_acceso",
        "noc",  # Flags de configuración
        "telemetria",
        "grafana_folder",  # Metadata de Grafana
        "gebus_hub",
        "gebus_hubs",
        "gebus_nodes",
        "gebus_device",  # Gebus metadata
        "gebus_elementId",
        "gebus_technology",
        "gebus_event",  # Más Gebus
        "suma",  # Flag adicional
        "alerta",
        "item_key",  # Metadata adicional de alertas
    }

    # Labels ESENCIALES que identifican la alerta
    # Incluir solo lo necesario para identificar únicamente el problema
    essential_labels = {
        k: v
        for k, v in labels.items()
        if k not in exclude_labels and v is not None and v != "" and v != "null"
    }

    # Serializar de forma determinística
    serialized = json.dumps(essential_labels, sort_keys=True, separators=(",", ":"))

    # Hash SHA256
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def extract_severity(labels: dict[str, Any]) -> str:
    """
    Extrae severidad de labels.
    Busca en orden: severity, level, priority
    """
    for key in ["severity", "level", "priority"]:
        if key in labels:
            return str(labels[key]).lower()
    return "info"  # Default


def extract_team(labels: dict[str, Any]) -> str:
    """Extrae team de labels"""
    for key in ["team", "squad", "owner"]:
        if key in labels:
            return str(labels[key])
    return None


def parse_grafana_timestamp(ts: Any) -> datetime:
    """
    Parsea timestamp de Grafana.
    Grafana envía ISO 8601 timestamps.
    """
    if isinstance(ts, datetime):
        return ts
    if isinstance(ts, str):
        # Pydantic ya debería hacer esto, pero por si acaso
        from dateutil import parser

        return parser.isoparse(ts)
    return None
