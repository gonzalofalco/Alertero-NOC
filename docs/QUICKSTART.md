# Quickstart - Comandos Útiles

Referencia rápida de comandos para operar Alertero.

## Comandos Make

```bash
cd /opt/alertero

# Levantar todos los servicios
make up

# Detener servicios
make down

# Reiniciar servicios
make restart

# Ver logs en tiempo real
make logs

# Ver logs de un servicio específico
make logs-backend
make logs-postgres
make logs-nginx

# Verificar salud de servicios
make health

# Aplicar migraciones de BD
make migrate

# Hacer backup de base de datos
make backup

# Restaurar desde backup
make restore BACKUP=alertero_backup_20240115_120000.sql.gz

# Conectar a PostgreSQL
make psql

# Ver ayuda de comandos
make help
```

## Docker Compose Directo

```bash
cd /opt/alertero

# Ver estado de contenedores
docker compose ps

# Ver logs específicos
docker compose logs -f backend
docker compose logs -f --tail=100 postgres

# Rebuild de servicios
docker compose build backend
docker compose build --no-cache frontend

# Reiniciar un servicio
docker compose restart backend

# Ejecutar comando en contenedor
docker compose exec backend bash
docker compose exec postgres psql -U alertero -d alertero

# Ver recursos utilizados
docker compose stats

# Eliminar todo (CUIDADO - borra datos)
docker compose down -v
```

## Gestión de Servicios (Systemd)

```bash
# Ver estado
sudo systemctl status alertero

# Iniciar
sudo systemctl start alertero

# Detener
sudo systemctl stop alertero

# Reiniciar
sudo systemctl restart alertero

# Ver logs
sudo journalctl -u alertero -f

# Ver logs desde hace 1 hora
sudo journalctl -u alertero --since "1 hour ago"

# Habilitar autostart
sudo systemctl enable alertero

# Deshabilitar autostart
sudo systemctl disable alertero
```

## API REST - Ejemplos con curl

### Health Check

```bash
# Verificar salud general
curl http://localhost/api/health

# Liveness probe
curl http://localhost/api/health/live

# Readiness probe
curl http://localhost/api/health/ready
```

### Listar Alertas

```bash
# Listar todas las alertas actuales
curl http://localhost/api/alerts/current

# Solo alertas firing
curl "http://localhost/api/alerts/current?status_filter=firing"

# Solo critical
curl "http://localhost/api/alerts/current?severity=critical"

# Filtrar por team
curl "http://localhost/api/alerts/current?team=infrastructure"

# Sin alertas silenciadas
curl "http://localhost/api/alerts/current?show_silenced=false"

# Paginación
curl "http://localhost/api/alerts/current?limit=10&offset=0"
```

### Estadísticas

```bash
# Ver stats
curl http://localhost/api/alerts/stats | jq

# Output ejemplo:
# {
#   "total": 45,
#   "firing": 12,
#   "resolved": 33,
#   "critical": 3,
#   "warning": 9,
#   "acked": 5,
#   "silenced": 2,
#   "top_teams": [...]
# }
```

### Detalle de Alerta

```bash
# Obtener detalle (fingerprint desde lista de alertas)
curl http://localhost/api/alerts/current/<fingerprint>
```

### Reconocer Alerta (ACK)

```bash
# ACK una alerta
curl -X POST http://localhost/api/alerts/current/<fingerprint>/ack \
  -H "Content-Type: application/json" \
  -d '{
    "acked_by": "Juan Perez",
    "comment": "Working on it"
  }'

# Quitar ACK
curl -X DELETE http://localhost/api/alerts/current/<fingerprint>/ack
```

### Historial de Alerta

```bash
# Ver historial completo
curl http://localhost/api/alerts/history/<fingerprint>
```

### Silencios

```bash
# Listar silencios activos
curl http://localhost/api/silences

# Crear silencio
curl -X POST http://localhost/api/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighCPU", "isRegex": false},
      {"name": "instance", "value": "server01", "isRegex": false}
    ],
    "expires_at": "2024-01-20T18:00:00Z",
    "created_by": "Juan Perez",
    "comment": "Mantenimiento programado"
  }'

# Eliminar silencio
curl -X DELETE http://localhost/api/silences/<silence_id>
```

### Testear Webhook

```bash
# Enviar alerta de prueba
curl -X POST http://localhost/api/webhook/grafana \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $(grep WEBHOOK_SECRET /etc/alertero/.env | cut -d= -f2)" \
  -d '{
    "receiver": "test",
    "status": "firing",
    "alerts": [{
      "status": "firing",
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning",
        "instance": "test-server"
      },
      "annotations": {
        "summary": "Test alert from curl",
        "description": "This is a test"
      },
      "startsAt": "2024-01-15T10:00:00Z",
      "generatorURL": "http://localhost"
    }]
  }'
```

## Base de Datos

```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U alertero -d alertero

# Queries útiles en psql:

# Contar alertas por status
SELECT status, COUNT(*) FROM alerts_current GROUP BY status;

# Top 10 alertas más frecuentes
SELECT alertname, COUNT(*) as count 
FROM alert_events 
GROUP BY alertname 
ORDER BY count DESC 
LIMIT 10;

# Alertas críticas activas
SELECT alertname, instance, summary, updated_at 
FROM alerts_current 
WHERE status='firing' AND severity='critical'
ORDER BY updated_at DESC;

# Ver silencios activos
SELECT id, created_by, comment, expires_at 
FROM silences 
WHERE active=true AND expires_at > NOW();

# Tamaño de tablas
SELECT 
  table_name, 
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

## Backups

```bash
# Backup manual
/opt/alertero/scripts/backup.sh

# Listar backups disponibles
ls -lh /var/lib/alertero/backups/

# Restaurar desde backup
/opt/alertero/scripts/restore.sh alertero_backup_20240115_120000.sql.gz

# Backup automático con cron (ya configurado en bootstrap)
# Runs daily at 02:00 AM
crontab -l | grep backup
```

## Logs

```bash
# Logs de backend (API)
docker compose logs -f backend

# Solo errores
docker compose logs backend | grep ERROR

# Logs de webhooks recibidos
docker compose logs backend | grep webhook

# Logs de Nginx (accesos)
docker compose logs nginx | grep webhook

# Ver logs del último arranque
docker compose logs --since "10m" backend

# Logs en archivo (si habilitado)
tail -f /var/log/alertero-backup.log
```

## Monitoreo

```bash
# Ver recursos utilizados
docker compose stats

# Ver procesos en contenedor
docker compose exec backend ps aux

# Ver variables de entorno
docker compose exec backend env

# Ver conexiones a PostgreSQL
docker compose exec postgres psql -U alertero -d alertero -c "SELECT * FROM pg_stat_activity;"

# Ping desde backend a postgres
docker compose exec backend ping -c 3 postgres
```

## Troubleshooting Rápido

```bash
# Reiniciar todo
cd /opt/alertero && docker compose restart

# Ver últimos logs con errores
docker compose logs --tail=100 | grep -i error

# Verificar conectividad de red interna
docker compose exec backend curl -I http://nginx

# Verificar permisos de archivos
ls -la /var/lib/alertero/
ls -la /etc/alertero/

# Rebuildar todo desde cero
docker compose down
docker compose build --no-cache
docker compose up -d

# Ver configuración cargada en nginx
docker compose exec nginx nginx -T

# Verificar sintaxis de nginx
docker compose exec nginx nginx -t
```

## Actualización del Sistema

```bash
cd /opt/alertero

# 1. Hacer backup ANTES de actualizar
make backup

# 2. Detener servicios
make down

# 3. Pull cambios (si es un repo git)
git pull

# 4. Rebuild imágenes
docker compose build

# 5. Levantar servicios
make up

# 6. Aplicar migraciones si hay
make migrate

# 7. Verificar salud
make health
```

## URLs Útiles

```bash
# Obtener IP del servidor
hostname -I | awk '{print $1}'

# Web UI
http://<server-ip>/

# API Docs (Swagger)
http://<server-ip>/api/docs

# Health endpoint
http://<server-ip>/api/health

# Stats JSON
http://<server-ip>/api/alerts/stats
```

## Variables de Entorno

```bash
# Ver archivo .env
cat /etc/alertero/.env

# Ver solo webhook secret
grep WEBHOOK_SECRET /etc/alertero/.env

# Editar configuración
sudo nano /etc/alertero/.env

# Después de editar, aplicar cambios:
cp /etc/alertero/.env /opt/alertero/.env
docker compose restart backend
```

## Maintenance Mode

```bash
# Detener recepción de webhooks (traer down nginx)
docker compose stop nginx

# Solo detener backend (manteniendo BD y nginx)
docker compose stop backend

# Volver a levantar
docker compose start nginx
docker compose start backend
```

## Limpieza

```bash
# Limpiar logs de Docker
docker system prune -a

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes huérfanos
docker volume prune

# Limpiar backups antiguos (más de 30 días)
find /var/lib/alertero/backups/ -name "*.sql.gz" -mtime +30 -delete
```

## Próximos Pasos

- Ver [SETUP_UBUNTU.md](./SETUP_UBUNTU.md) para instalación completa
- Ver [GRAFANA_WEBHOOK.md](./GRAFANA_WEBHOOK.md) para configurar Grafana
- Implementar HTTPS en producción
- Configurar monitoreo de Alertero mismo
