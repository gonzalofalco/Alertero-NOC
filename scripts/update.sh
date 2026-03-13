#!/bin/bash
# Update script para Alertero
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }

# Verificar root
if [ "$EUID" -ne 0 ]; then
    error "Ejecutar como root (sudo)"
fi

echo "=== Alertero Update Script ==="
cd "$PROJECT_DIR"

# Bajar últimos cambios
section "Actualizando código"
git pull origin main
info "Código actualizado"

# Rebuildar y reiniciar servicios
section "Actualizando servicios Docker"
docker compose build
docker compose up -d
info "Servicios actualizados"

# Verificar salud
section "Verificando salud"
sleep 10
for i in {1..15}; do
    if docker compose exec -T backend curl -sf http://localhost:8000/api/health/live > /dev/null 2>&1; then
        info "Backend healthy"
        break
    fi
    [ $i -eq 15 ] && error "Backend no respondió tras la actualización"
    sleep 2
done

echo ""
echo "=== Actualización completada ==="
info "Versión activa: $(git log -1 --format='%h - %s')"
