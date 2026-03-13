#!/bin/bash
# Bootstrap script para instalación completa de Alertero en Ubuntu

set -e

# Resolver path real del proyecto para no depender de /opt/alertero
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="/etc/alertero/.env"

echo "=== Alertero Bootstrap Script ==="
echo "Este script instalará y configurará Alertero en Ubuntu"
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then 
    echo "Por favor ejecutar como root (sudo)"
    exit 1
fi

# 1. Verificar/Instalar Docker y Docker Compose
echo "1. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "  Docker no encontrado. Instalando..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    systemctl enable docker
    systemctl start docker
    echo "  ✓ Docker instalado"
else
    echo "  ✓ Docker ya instalado"
fi

# 2. Crear directorios de datos
echo ""
echo "2. Creando directorios..."
mkdir -p /var/lib/alertero/postgres
mkdir -p /var/lib/alertero/backups
mkdir -p /etc/alertero
echo "  ✓ Directorios creados"

# 3. Generar secretos si no existen
echo ""
echo "3. Configurando secretos..."
if [ ! -f "$ENV_FILE" ]; then
    echo "  Generando .env..."
    
    # Generar contraseña segura para PostgreSQL
    PG_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Generar webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    cat > "$ENV_FILE" << ENVEOF
# Alertero Configuration
# Generado automáticamente por bootstrap.sh

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
    
    chmod 600 "$ENV_FILE"
    echo "  ✓ .env creado en /etc/alertero/"
    echo "  ⚠️  IMPORTANTE: Guardar estos secretos de forma segura"
    echo "     Webhook Secret: ${WEBHOOK_SECRET}"
else
    echo "  ✓ .env ya existe"
fi

# 4. Copiar .env al directorio del proyecto
cp "$ENV_FILE" "$PROJECT_DIR/.env"

# 5. Build y levantar servicios
echo ""
echo "4. Building y levantando servicios..."
cd "$PROJECT_DIR"
docker-compose build
docker-compose up -d

echo "  Esperando a que los servicios estén listos..."
sleep 10

# 6. Verificar salud
echo ""
echo "5. Verificando salud de servicios..."
for i in {1..30}; do
    if docker-compose exec -T backend curl -sf http://localhost:8000/api/health/live > /dev/null 2>&1; then
        echo "  ✓ Backend healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ✗ Backend no respondió"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# 7. Configurar systemd para autostart
echo ""
echo "6. Configurando systemd..."
if [ -f "$PROJECT_DIR/systemd/alertero.service" ]; then
    cp "$PROJECT_DIR/systemd/alertero.service" /etc/systemd/system/
    sed -i "s|^WorkingDirectory=.*|WorkingDirectory=${PROJECT_DIR}|" /etc/systemd/system/alertero.service
    systemctl daemon-reload
    systemctl enable alertero
    echo "  ✓ Systemd configurado (autostart habilitado)"
fi

# 8. Configurar cron para backups diarios
echo ""
echo "7. Configurando backups automáticos..."
CRON_LINE="0 2 * * * ${PROJECT_DIR}/scripts/backup.sh >> /var/log/alertero-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v backup.sh; echo "$CRON_LINE") | crontab -
echo "  ✓ Backup diario configurado (02:00 AM)"

echo ""
echo "=== Instalación completada ==="
echo ""
echo "Servicios disponibles:"
echo "  - Web UI: http://$(hostname -I | awk '{print $1}')"
echo "  - API:    http://$(hostname -I | awk '{print $1}')/api"
echo ""
echo "Webhook URL para Grafana:"
echo "  http://$(hostname -I | awk '{print $1}')/api/v1/webhook/grafana"
echo "  Header: X-Webhook-Secret: $(grep WEBHOOK_SECRET "$ENV_FILE" | cut -d= -f2)"
echo ""
echo "Comandos útiles:"
echo "  make logs      # Ver logs"
echo "  make health    # Verificar salud"
echo "  make backup    # Hacer backup manual"
echo "  make psql      # Conectar a PostgreSQL"
echo ""
echo "Documentación en: ${PROJECT_DIR}/docs/"
