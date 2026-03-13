from datetime import timezone
"""
Utility functions for alert processing.
"""

import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any


def generate_fingerprint(labels: dict[str, Any]) -> str:
    """
    Generate stable SHA256 fingerprint based on ESSENTIAL labels.

    Only uses labels that truly identify a unique alert,
    ignoring configuration flags (gebus, noc_acceso, cgs) that may
    change between Grafana updates.

    Essential labels for unique alert identification:
    - alertname: rule name
    - instance/cmts/system_name/grupo: affected equipment
    - description/port_port_id: specific problem detail
    - HUB/region: geographic location
    """
    # Labels that should NOT affect fingerprint (config flags, metadata)
    exclude_labels = {
        "__name__",
        "__tenant_id__",  # Grafana internals
        "gebus",
        "cgs",
        "noc_acceso",
        "noc",  # Configuration flags
        "telemetria",
        "grafana_folder",  # Grafana metadata
        "gebus_hub",
        "gebus_hubs",
        "gebus_nodes",
        "gebus_device",  # Gebus metadata
        "gebus_elementId",
        "gebus_technology",
        "gebus_event",  # More Gebus
        "suma",  # Additional flag
        "alerta",
        "item_key",  # Additional alert metadata
    }

    # ESSENTIAL labels that identify the alert
    essential_labels = {
        k: v
        for k, v in labels.items()
        if k not in exclude_labels and v is not None and v != "" and v != "null"
    }

    # Serialize deterministically
    serialized = json.dumps(essential_labels, sort_keys=True, separators=(",", ":"))

    # SHA256 hash
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def extract_severity(labels: dict[str, Any]) -> str:
    """
    Extract severity from labels.
    Searches in order: severity, level, priority
    """
    for key in ["severity", "level", "priority"]:
        if key in labels:
            return str(labels[key]).lower()
    return "info"  # Default


def extract_team(labels: dict[str, Any]) -> str | None:
    """
    Extract team from labels.

    For Telecentro alerts:
    - oym: acceso_hfc, acceso_ftth, core, transmision
    - team: standard label
    - noc: indicates if it's a NOC alert
    """
    # If it already has team, use it
    if "team" in labels and labels["team"]:
        return labels["team"]

    # Extract from oym (Operation & Maintenance)
    if "oym" in labels and labels["oym"]:
        oym = labels["oym"]
        # Convert acceso_hfc -> HFC, acceso_ftth -> FTTH, etc.
        if "acceso_hfc" in oym:
            return "Acceso HFC"
        elif "acceso_ftth" in oym:
            return "Acceso FTTH"
        elif "core" in oym:
            return "Core"
        elif "transmision" in oym:
            return "Transmisión"
        else:
            return oym.replace("_", " ").title()

    # If it's a NOC alert
    if labels.get("noc") == "true" or labels.get("noc_acceso") == "true":
        return "NOC"

    # Fallback
    return None


def extract_instance(labels: dict[str, Any]) -> str:
    """
    Extract relevant instance/equipment from labels.

    For Telecentro alerts:
    - cmts (HFC)
    - gebus_elementId (general equipment)
    - system_name (FTTH)
    - grupo (FTTH OLTs)
    - instance (default)
    """
    instance_keys = [
        "cmts",  # HFC: CA-CBR8-CMTS-8
        "gebus_elementId",  # General equipment
        "system_name",  # FTTH: LP-7750SR7s-PE-1
        "grupo",  # FTTH OLT groups
        "instance",  # Grafana default
    ]

    for key in instance_keys:
        if key in labels and labels[key] and labels[key] != "null":
            return labels[key]

    return labels.get("instance", "")


def parse_annotations(annotations: dict[str, Any], labels: dict[str, Any]) -> tuple[str, str]:
    """
    Parse Grafana annotations to extract summary and description.

    Grafana can send:
    - summary/description in annotations
    - message in annotations (long text with info)
    - description in labels with special format

    Returns: (summary, description)
    """
    summary = annotations.get("summary", "")
    description = annotations.get("description", "")
    message = annotations.get("message", "")

    # If no summary, try to generate one
    if not summary:
        # Option 1: First line of message
        if message:
            first_line = message.split("\n")[0].strip("- ").strip()
            if first_line and len(first_line) < 200:
                summary = first_line

        # Option 2: Use description from labels (common in access alerts)
        if not summary and "description" in labels:
            label_desc = labels.get("description", "")
            # Extract useful info from format ##CR## {0001:OLT:XXX:PO1}
            if "OLT:" in label_desc:
                summary = f"Affected Port: {label_desc}"
            else:
                summary = label_desc[:200]

        # Option 3: Generate from alertname
        if not summary:
            alertname = labels.get("alertname", "")
            summary = alertname.replace("-", " ").replace("_", " ").title()

    # If no description, use message
    if not description and message:
        description = message

    return summary, description


def match_silence_matchers(matchers: list, labels: dict) -> bool:
    """
    Check if ALL matchers match the labels.

    Matcher format: {"label": "alertname", "value": "HighCPU", "is_regex": false}

    Returns True if all matchers match, False otherwise.
    """
    for matcher in matchers:
        label_key = matcher.get("label")
        value = matcher.get("value")
        is_regex = matcher.get("is_regex", False)

        if label_key not in labels:
            return False

        label_value = str(labels[label_key])

        if is_regex:
            try:
                if not re.match(value, label_value):
                    return False
            except re.error:
                return False
        else:
            if label_value != value:
                return False

    return True


def make_aware_utc(dt: datetime | None) -> datetime | None:
    """Convert naive datetime to UTC timezone-aware datetime."""
    if dt and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
