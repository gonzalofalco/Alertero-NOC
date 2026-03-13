#!/bin/bash
# Backup script para Alertero
# Realiza backup de PostgreSQL con retención de 7 días

set -e

BACKUP_DIR="/var/lib/alertero/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="alertero_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=== Alertero Backup Script ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup file: $BACKUP_FILE"

# Realizar backup con pg_dump
echo "Creating database backup..."
docker compose exec -T postgres pg_dump -U alertero alertero | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully: ${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Calcular tamaño
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "  Size: $SIZE"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Limpiar backups antiguos
echo "Cleaning old backups (retention: ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "alertero_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Listar backups disponibles
echo ""
echo "Available backups:"
ls -lh "$BACKUP_DIR"/alertero_backup_*.sql.gz 2>/dev/null || echo "  (none)"

echo ""
echo "=== Backup completed ===="
