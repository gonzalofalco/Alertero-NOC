#!/bin/bash
# Punto de entrada para instalación de Alertero
# Redirige al script de bootstrap completo
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/scripts/bootstrap.sh" "$@"
