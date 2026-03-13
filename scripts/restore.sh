#!/bin/bash
# Restore script para Alertero

set -e

BACKUP_DIR="/var/lib/alertero/backups"

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/alertero_backup_*.sql.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

BACKUP_FILE="$1"

# Si solo se pasó el nombre del archivo, agregarlo al path completo
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== Alertero Restore Script ==="
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "⚠️  This will REPLACE the current database. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Stopping backend service..."
docker compose stop backend

echo "Dropping and recreating database..."
docker compose exec -T postgres psql -U alertero -d postgres -c "DROP DATABASE IF EXISTS alertero;"
docker compose exec -T postgres psql -U alertero -d postgres -c "CREATE DATABASE alertero;"

echo "Restoring backup..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U alertero -d alertero

if [ $? -eq 0 ]; then
    echo "✓ Restore completed successfully"
    
    echo "Starting backend service..."
    docker compose start backend
    
    echo ""
    echo "=== Restore completed ==="
else
    echo "✗ Restore failed!"
    exit 1
fi
