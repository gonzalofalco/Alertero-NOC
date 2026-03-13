# Setup Alertero en Ubuntu

Guía paso a paso para instalar Alertero en Ubuntu Server (20.04+).

## Requisitos

- Ubuntu Server 20.04 LTS o superior
- Acceso root/sudo
- Conexión a Internet
- Mínimo 2 GB RAM
- Mínimo 20 GB espacio en disco

## Método 1: Instalación Automática (Recomendado)

```bash
# 1. Clonar o descargar proyecto en /opt/alertero
cd /opt
git clone <your-repo-url> alertero
# O copiar archivos manualmente

# 2. Ejecutar bootstrap
cd /opt/alertero
sudo ./scripts/bootstrap.sh
```

El script bootstrap automáticamente:
- ✓ Instala Docker y Docker Compose
- ✓ Crea directorios necesarios
- ✓ Genera secretos y configuración
- ✓ Levanta todos los servicios
- ✓ Configura autostart con systemd
- ✓ Configura backups automáticos diarios

## Método 2: Instalación Manual

### Paso 1: Instalar Docker

```bash
# Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar dependencias
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Agregar repositorio de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar y arrancar Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verificar
docker --version
docker compose version
```

### Paso 2: Crear Estructura de Directorios

```bash
# Directorios de datos persistentes
sudo mkdir -p /var/lib/alertero/postgres
sudo mkdir -p /var/lib/alertero/backups

# Directorio para secretos
sudo mkdir -p /etc/alertero
```

### Paso 3: Configurar Variables de Entorno

```bash
# Generar contraseña segura para PostgreSQL
PG_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Generar webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)

# Crear archivo .env
sudo tee /etc/alertero/.env > /dev/null << ENVEOF
# Alertero Configuration

# PostgreSQL
POSTGRES_DB=alertero
POSTGRES_USER=alertero
POSTGRES_PASSWORD=${PG_PASSWORD}

# Backend
DATABASE_URL=postgresql://alertero:${PG_PASSWORD}@postgres:5432/alertero
WEBHOOK_SECRET=${WEBHOOK_SECRET}
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=*

# Timezone
TZ=America/Argentina/Buenos_Aires
ENVEOF

# Proteger archivo
sudo chmod 600 /etc/alertero/.env

# Copiar al proyecto
sudo cp /etc/alertero/.env /opt/alertero/.env
```

**IMPORTANTE:** Guardar el `WEBHOOK_SECRET` generado para configurar en Grafana.

### Paso 4: Build y Levantar Servicios

```bash
cd /opt/alertero

# Build de imágenes
sudo docker compose build

# Levantar servicios
sudo docker compose up -d

# Verificar estado
sudo docker compose ps
```

### Paso 5: Verificar Instalación

```bash
# Ver logs
sudo docker compose logs -f

# Verificar health
curl http://localhost/api/health

# Debería retornar:
# {"status":"healthy","timestamp":"...","database":true,"environment":"production"}
```

### Paso 6: Configurar Autostart (Systemd)

```bash
# Copiar service unit
sudo cp /opt/alertero/systemd/alertero.service /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar autostart
sudo systemctl enable alertero

# Verificar
sudo systemctl status alertero
```

### Paso 7: Configurar Backups Automáticos

```bash
# Agregar cron job para backups diarios a las 02:00 AM
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /opt/alertero/scripts/backup.sh >> /var/log/alertero-backup.log 2>&1") | sudo crontab -

# Verificar
sudo crontab -l
```

## Post-Instalación

### Acceder a la Aplicación

- **Web UI:** `http://<server-ip>/`
- **API:** `http://<server-ip>/api`
- **API Docs:** `http://<server-ip>/api/docs` (FastAPI Swagger)

### Comandos Útiles

```bash
cd /opt/alertero

# Ver logs en tiempo real
make logs

# Ver estado de salud
make health

# Hacer backup manual
make backup

# Conectar a PostgreSQL
make psql

# Reiniciar servicios
make restart

# Ver estadísticas de alertas
curl http://localhost/api/alerts/stats
```

### Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (si usas SSL)
sudo ufw allow 443/tcp

# Verificar
sudo ufw status
```

## Configuración de Producción

### 1. HTTPS con Let's Encrypt

```bash
# Instalar certbot
sudo apt-get install -y certbot

# Obtener certificado (ejemplo para nginx standalone)
sudo certbot certonly --standalone -d alertero.example.com

# Los certificados estarán en:
# /etc/letsencrypt/live/alertero.example.com/
```

Editar `/opt/alertero/nginx/alertero.conf` y descomentar la sección HTTPS.

### 2. Restricción de IPs para Webhook

Editar `/opt/alertero/nginx/locations.conf`:

```nginx
location /api/webhook/grafana {
    # Permitir solo IPs de Grafana
    allow 10.x.x.x/24;    # Red de Grafana
    allow 172.16.x.x;     # IP específica
    deny all;
    
    # ... resto de configuración
}
```

Reiniciar nginx:
```bash
docker compose restart nginx
```

### 3. Monitoreo y Logs

```bash
# Ver logs en journald
sudo journalctl -u alertero -f

# Ver logs de contenedores
docker compose logs -f

# Ver logs específicos
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f nginx
```

## Troubleshooting

### Backend no inicia

```bash
# Verificar logs
docker compose logs backend

# Verificar conectividad a PostgreSQL
docker compose exec backend ping postgres

# Verificar variables de entorno
docker compose exec backend env | grep DATABASE_URL
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL está corriendo
docker compose ps postgres

# Verificar logs de PostgreSQL
docker compose logs postgres

# Conectar manualmente
docker compose exec postgres psql -U alertero -d alertero
```

### Nginx no sirve frontend

```bash
# Verificar que el build de frontend se haya completado
docker compose logs nginx

# Verificar archivos estáticos
docker compose exec nginx ls -la /usr/share/nginx/html/
```

### Webhook no recibe alertas

```bash
# Verificar logs del webhook
docker compose logs backend | grep webhook

# Testear manualmente
curl -X POST http://localhost/api/webhook/grafana \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <tu-secret>" \
  -d '{"alerts":[]}'
```

## Actualización

```bash
cd /opt/alertero

# Hacer backup antes de actualizar
make backup

# Pull cambios del repositorio
git pull

# Rebuild y recrear contenedores
docker compose build
docker compose up -d

# Verificar
make health
```

## Desinstalación

```bash
# Detener servicios
sudo systemctl stop alertero
sudo systemctl disable alertero

# Eliminar contenedores
cd /opt/alertero
docker compose down -v

# Eliminar datos (CUIDADO!)
sudo rm -rf /var/lib/alertero
sudo rm -rf /etc/alertero
sudo rm -rf /opt/alertero

# Eliminar systemd unit
sudo rm /etc/systemd/system/alertero.service
sudo systemctl daemon-reload
```

## Soporte

Ver documentación completa en `/opt/alertero/docs/`
