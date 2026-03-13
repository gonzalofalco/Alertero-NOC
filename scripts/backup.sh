#!/bin/bash
# Backup script para Alertero
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="/var/lib/alertero/backups"
DATE=$(date +%Y%m%d_%H%M%S)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }

section "Backup Alertero - $DATE"

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
info "Dumpeando base de datos..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres \
    pg_dump -U alertero alertero > "$BACKUP_DIR/alertero_$DATE.sql"
gzip "$BACKUP_DIR/alertero_$DATE.sql"
info "Backup guardado: $BACKUP_DIR/alertero_$DATE.sql.gz"

# Limpiar backups con más de 30 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
info "Backups viejos limpiados"

echo ""
info "Backup completado ✅"
