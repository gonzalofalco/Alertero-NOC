# Alertero 🚨

**Dashboard Profesional de Alertas de Grafana para NOC/SOC**

Sistema centralizado de gestión y visualización de alertas de Grafana con interfaz profesional diseñada para entornos de Network Operations Center (NOC) y Security Operations Center (SOC).

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Base de Datos](#-base-de-datos)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Integración con Grafana](#-integración-con-grafana)
- [Uso de la Interfaz](#-uso-de-la-interfaz)
- [API Endpoints](#-api-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Seguridad](#-seguridad)
- [Mantenimiento](#-mantenimiento)

---

## 🎯 Descripción General

**Alertero** es un dashboard de gestión de alertas diseñado específicamente para recibir, almacenar y visualizar alertas de Grafana en tiempo real. Proporciona una interfaz moderna y profesional que permite a los equipos de operaciones:

- **Recibir alertas** desde Grafana mediante webhook
- **Visualizar alertas** en tiempo real con diseño tipo NOC/SOC
- **Clasificar alertas** por severidad, estado y equipo responsable
- **Reconocer alertas** (ACK) con notas y seguimiento
- **Métricas en tiempo real** con dashboard interactivo
- **Historial completo** de eventos de alertas

### Caso de Uso

Ideal para organizaciones que utilizan Grafana para monitoreo y necesitan:
- Centralizar todas las alertas en un único dashboard
- Facilitar la identificación visual por tipo de alerta y equipo
- Permitir reconocimiento y seguimiento de alertas críticas
- Mantener historial detallado de eventos
- Visualización optimizada para múltiples monitores en salas NOC/SOC

---

## ✨ Características Principales

### 🎨 Interfaz Profesional
- **Modo oscuro por defecto** optimizado para salas de operaciones
- **Vista de cards y tabla** intercambiables
- **Color-coding por equipo** (Backend, Frontend, Infra, Database, Network, Security, DevOps, Platform, Monitoring)
- **Badges visuales** para severidad (Critical 🔴, Warning ⚠️, Info ℹ️)
- **Indicadores de estado** animados (Firing/Resolved)
- **Modal popup** para detalles completos de cada alerta

### 📊 Dashboard de Métricas
- **Total de alertas** activas
- **Alertas críticas** en tiempo real
- **Warnings activos**
- **Alertas disparadas** (Firing)
- **Alertas resueltas**
- **Alertas reconocidas** (ACK)
- **Filtros clickeables** en cada métrica

### 🔔 Gestión de Alertas
- **Reconocimiento (ACK)** con notas opcionales
- **Filtrado avanzado** por:
  - Estado (Firing/Resolved)
  - Severidad (Critical/Warning/Info)
  - Estado de reconocimiento
  - Equipo responsable
  - Texto de búsqueda
- **Ordenamiento** por fecha, severidad, nombre
- **Actualización automática** cada 30 segundos

### 🔗 Integración Completa
- **Webhook de Grafana** con autenticación Bearer
- **Enlaces directos** a Grafana desde cada alerta
- **Soporte de labels** personalizados
- **Anotaciones** y descripciones completas

---

## 🛠 Stack Tecnológico

### Backend
```
🐍 Python 3.12
⚡ FastAPI (Framework web asíncrono)
🗄️ PostgreSQL 16 (Base de datos)
🔧 SQLAlchemy (ORM)
🔐 Pydantic (Validación de datos)
📦 Psycopg2 (Driver PostgreSQL)
🐳 Docker & Docker Compose
```

### Frontend
```
⚛️ React 18.3
⚡ Vite 5.4 (Build tool)
🎨 Tailwind CSS 3.4
📦 Axios (HTTP client)
🔄 Hooks de React (useState, useEffect)
```

### Infraestructura
```
🌐 Nginx (Reverse proxy y servidor estático)
🐳 Docker Compose (Orquestación)
🔒 Red Docker privada (Seguridad)
📝 Logs centralizados
```

---

## 🏗 Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                         GRAFANA                              │
│                    (Alertmanager)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       │ Authorization: Bearer <token>
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX :8080                               │
│              (Reverse Proxy)                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  /              → Frontend (React SPA)                 │ │
│  │  /api/webhook/* → Backend :8000                        │ │
│  │  /api/*         → Backend :8000                        │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴────────────────┐
        ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  FRONTEND        │          │   BACKEND        │
│  React + Vite    │◄────────►│   FastAPI        │
│  Tailwind CSS    │   API    │   Python 3.12    │
│  Port: 80        │  Calls   │   Port: 8000     │
└──────────────────┘          └────────┬─────────┘
                                       │
                                       │ SQLAlchemy
                                       ▼
                              ┌──────────────────┐
                              │   PostgreSQL 16  │
                              │   Port: 5432     │
                              │   DB: alertero   │
                              └──────────────────┘
```

### Flujo de Datos

1. **Grafana** dispara alerta → envía webhook POST a nginx:8080
2. **Nginx** recibe en `/api/v1/webhook/grafana` → proxy a backend:8000
3. **Backend FastAPI**:
   - Valida autenticación Bearer
   - Procesa payload de Grafana
   - Actualiza o crea alerta en PostgreSQL
   - Registra evento en `alert_events`
4. **Frontend React**:
   - Consulta `/api/alerts` cada 30s
   - Renderiza alertas con diseño profesional
   - Permite ACK y filtrado en tiempo real

---

## 💾 Base de Datos

### PostgreSQL 16

**Database:** `alertero`  
**Usuario:** `alertero`  
**Charset:** UTF8

### Esquema de Tablas

#### **Tabla: `alerts_current`**
Almacena el estado actual de cada alerta única (por fingerprint).

```sql
CREATE TABLE alerts_current (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,  -- ID único de Grafana
    alertname VARCHAR(255) NOT NULL,           -- Nombre de la alerta
    status VARCHAR(50) NOT NULL,               -- firing | resolved
    severity VARCHAR(50),                      -- critical | warning | info
    instance VARCHAR(255),                     -- Instancia afectada
    team VARCHAR(100),                         -- Equipo responsable
    labels JSONB,                              -- Labels adicionales
    annotations JSONB,                         -- Anotaciones (summary, description)
    starts_at TIMESTAMP,                       -- Inicio de la alerta
    ends_at TIMESTAMP,                         -- Fin de la alerta (si resolved)
    generator_url TEXT,                        -- URL a Grafana
    acked BOOLEAN DEFAULT FALSE,               -- Reconocida?
    acked_by VARCHAR(100),                     -- Usuario que reconoció
    acked_at TIMESTAMP,                        -- Fecha de reconocimiento
    ack_note TEXT,                             -- Nota del reconocimiento
    created_at TIMESTAMP DEFAULT NOW(),        -- Primera vez vista
    updated_at TIMESTAMP DEFAULT NOW()         -- Última actualización
);

-- Índices para rendimiento
CREATE INDEX idx_alerts_fingerprint ON alerts_current(fingerprint);
CREATE INDEX idx_alerts_status ON alerts_current(status);
CREATE INDEX idx_alerts_severity ON alerts_current(severity);
CREATE INDEX idx_alerts_acked ON alerts_current(acked);
CREATE INDEX idx_alerts_team ON alerts_current(team);
```

#### **Tabla: `alert_events`**
Historial completo de todos los cambios de estado de alertas.

```sql
CREATE TABLE alert_events (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) NOT NULL,         -- Referencia a la alerta
    event_type VARCHAR(50) NOT NULL,           -- new | update | resolved | ack
    status VARCHAR(50),                        -- Estado en ese momento
    severity VARCHAR(50),
    details JSONB,                             -- Datos completos del evento
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_events_fingerprint ON alert_events(fingerprint);
CREATE INDEX idx_events_created_at ON alert_events(created_at DESC);
```

### Datos de Ejemplo

```json
// Alerta en alerts_current
{
  "fingerprint": "8f7e3c2a1b4d",
  "alertname": "HighCPUUsage",
  "status": "firing",
  "severity": "critical",
  "instance": "server-prod-01",
  "team": "infra",
  "labels": {
    "alertname": "HighCPUUsage",
    "severity": "critical",
    "team": "infra",
    "env": "production"
  },
  "annotations": {
    "summary": "CPU usage above 90%",
    "description": "Server server-prod-01 has CPU usage at 95% for 5 minutes"
  },
  "starts_at": "2026-02-02T14:30:00Z",
  "generator_url": "https://grafana.example.com/alerting/grafana/...",
  "acked": false
}
```

---

## 📦 Requisitos Previos

### Software Necesario

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Grafana** >= 9.0 (con Alertmanager)
- **Acceso a puertos**: 8080 (HTTP)

### Recursos Mínimos

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 10 GB (para logs y base de datos)
- **Red**: Conectividad con Grafana

---

## 🚀 Instalación

### 1. Clonar o Crear Estructura

```bash
mkdir -p /opt/alertero
cd /opt/alertero
```

### 2. Crear `docker-compose.simple.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: postgres
    environment:
      POSTGRES_USER: alertero
      POSTGRES_PASSWORD: <DB_PASSWORD>
      POSTGRES_DB: alertero
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - alertero
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: backend
    environment:
      DATABASE_URL: postgresql://alertero:<DB_PASSWORD>@postgres:5432/alertero
      WEBHOOK_SECRET: <WEBHOOK_SECRET>
    depends_on:
      - postgres
    networks:
      - alertero
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    networks:
      - alertero
    restart: unless-stopped

networks:
  alertero:
    driver: bridge

volumes:
  postgres_data:
```

### 3. Construir e Iniciar

```bash
# Construir backend
cd backend
docker build -t alertero-backend .

# Construir frontend
cd ../frontend
npm install
npm run build

# Iniciar todos los servicios
cd ..
docker-compose -f docker-compose.simple.yml up -d
```

### 4. Verificar Instalación

```bash
# Verificar contenedores
docker ps

# Verificar logs
docker logs backend
docker logs nginx
docker logs postgres

# Probar API
curl http://localhost:8080/api/health
```

---

## ⚙️ Configuración

### Variables de Entorno

#### Backend (`backend/.env`)

```bash
# Base de datos
DATABASE_URL=postgresql://alertero:<DB_PASSWORD>@postgres:5432/alertero

# Webhook secret (generar nuevo token seguro)
WEBHOOK_SECRET=<WEBHOOK_SECRET>

# CORS (opcional)
ALLOWED_ORIGINS=*
```

#### Frontend (`frontend/.env`)

```bash
# URL del backend (relativo por defecto)
VITE_API_URL=/api
```

### Nginx (`nginx/nginx.conf`)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API Backend
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

---

## 🔗 Integración con Grafana

### Paso 1: Configurar Contact Point

1. En Grafana, ir a **Alerting** → **Contact points**
2. Click en **New contact point**
3. Configurar:

```yaml
Name: Alertero
Type: Webhook

URL: http://<SERVER_IP>:8080/api/v1/webhook/grafana

HTTP Method: POST

Authorization Header:
  Type: Bearer token
  Credentials: <WEBHOOK_SECRET>
```

### Paso 2: Crear Notification Policy

1. Ir a **Alerting** → **Notification policies**
2. Agregar política que apunte al contact point "Alertero"

### Paso 3: Configurar Alertas

Al crear alertas en Grafana, agregar **labels** para mejor clasificación:

```yaml
Labels:
  severity: critical     # critical | warning | info
  team: infra           # backend | frontend | infra | database | network | security | devops | platform | monitoring
  env: production       # production | staging | dev
```

### Paso 4: Probar Integración

```bash
# Desde Grafana, usar "Test" en el contact point
# O enviar manualmente:

curl -X POST http://<SERVER_IP>:8080/api/v1/webhook/grafana \
  -H "Authorization: Bearer <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "status": "firing",
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning",
        "team": "infra"
      },
      "annotations": {
        "summary": "This is a test alert"
      },
      "startsAt": "2026-02-02T10:00:00Z",
      "fingerprint": "test123"
    }]
  }'
```

---

## 🖥 Uso de la Interfaz

### Acceso

Abrir navegador en: **http://<SERVER_IP>:8080**

### Dashboard Principal

#### **Header**
- 🚨 **Alertero** - Logo y título
- 🌓 Botón de modo oscuro/claro
- 🔄 Actualización automática cada 30s

#### **Dashboard de Métricas**
6 cards clickeables con métricas en tiempo real:
- **TOTAL** - Todas las alertas activas
- **CRITICAL** - Alertas críticas (rojas)
- **WARNINGS** - Advertencias (amarillas)
- **FIRING** - Alertas actualmente disparadas
- **RESOLVED** - Alertas resueltas
- **ACKNOWLEDGED** - Alertas reconocidas

*Click en cualquier card para filtrar la vista*

#### **Controles de Vista**
- 🎴 **Cards** - Vista en tarjetas con color-coding
- 📋 **Table** - Vista de tabla compacta
- 🔍 **Búsqueda** - Filtro de texto
- 📊 **Ordenamiento** - Por fecha/severidad/nombre
- 🎯 **Filtros** - Por estado/severidad/ACK/equipo

#### **Vista de Cards**
Cada card muestra:
- Badge de **severidad** con emoji (🔴 Critical, ⚠️ Warning, ℹ️ Info)
- Badge de **estado** (Firing animado / Resolved)
- Badge de **equipo** con color único
- **Nombre** de la alerta
- **Instancia** afectada
- **Descripción** breve
- **Timestamp** de inicio
- Badge de **ACK** si está reconocida

*Click en card para abrir modal con detalles completos*

#### **Modal de Detalle**
Popup profesional que muestra:
- Header con título y botón cerrar (X)
- Badges de severidad, estado, ACK, equipo
- Nombre completo de la alerta
- Summary y description
- Detalles técnicos (instance, fingerprint, timestamps)
- Labels completos
- Información de reconocimiento (si aplica)
- Link directo a Grafana
- Campo para **reconocer alerta** con nota opcional

### Reconocer una Alerta (ACK)

1. Click en una alerta para abrir el modal
2. En el footer, escribir nota opcional
3. Click en **"Reconocer Alerta"**
4. La alerta se marca como reconocida con tu usuario y timestamp

### Filtrado Avanzado

**Desde Dashboard:**
- Click en métrica → filtra automáticamente

**Desde Controles:**
- **Search:** Buscar por nombre, instance, descripción
- **Status:** Firing / Resolved / All
- **Severity:** Critical / Warning / Info / All
- **ACK:** Acknowledged / Unacknowledged / All
- **Team:** Backend / Frontend / Infra / etc.

---

## 📡 API Endpoints

### Webhook

#### `POST /api/v1/webhook/grafana`
Recibe alertas de Grafana.

**Headers:**
```
Authorization: Bearer <WEBHOOK_SECRET>
Content-Type: application/json
```

**Body:**
```json
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighCPU",
        "severity": "critical",
        "team": "infra"
      },
      "annotations": {
        "summary": "CPU high",
        "description": "CPU usage above threshold"
      },
      "startsAt": "2026-02-02T10:00:00Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "https://grafana.example.com/...",
      "fingerprint": "abc123"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Processed 1 alerts",
  "fingerprints": ["abc123"]
}
```

### Alertas

#### `GET /api/alerts`
Obtiene todas las alertas activas.

**Response:**
```json
[
  {
    "id": 1,
    "fingerprint": "abc123",
    "alertname": "HighCPU",
    "status": "firing",
    "severity": "critical",
    "instance": "server-01",
    "team": "infra",
    "labels": {...},
    "annotations": {...},
    "starts_at": "2026-02-02T10:00:00Z",
    "acked": false,
    "created_at": "2026-02-02T10:00:00Z",
    "updated_at": "2026-02-02T10:00:00Z"
  }
]
```

#### `POST /api/alerts/{alert_id}/ack`
Reconoce una alerta.

**Body:**
```json
{
  "acked_by": "user@example.com",
  "ack_note": "Investigating the issue"
}
```

**Response:**
```json
{
  "message": "Alert acknowledged successfully"
}
```

#### `GET /api/alerts/{fingerprint}/events`
Obtiene historial de eventos de una alerta.

**Response:**
```json
[
  {
    "id": 1,
    "event_type": "new",
    "status": "firing",
    "created_at": "2026-02-02T10:00:00Z"
  },
  {
    "id": 2,
    "event_type": "ack",
    "created_at": "2026-02-02T10:05:00Z"
  }
]
```

#### `GET /api/health`
Health check del backend.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## 📁 Estructura del Proyecto

```
/opt/alertero/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app principal
│   │   ├── database.py          # Conexión PostgreSQL
│   │   ├── models/
│   │   │   └── alert.py         # Modelos SQLAlchemy
│   │   ├── routers/
│   │   │   ├── webhook.py       # Webhook de Grafana
│   │   │   └── alerts.py        # API de alertas
│   │   └── schemas/
│   │       └── alert.py         # Schemas Pydantic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Componente principal
│   │   ├── main.jsx             # Entry point
│   │   ├── index.css            # Tailwind CSS
│   │   └── components/
│   │       ├── Dashboard.jsx    # Dashboard de métricas
│   │       ├── AlertCard.jsx    # Card de alerta
│   │       ├── AlertsTable.jsx  # Tabla de alertas
│   │       └── AlertDetail.jsx  # Modal de detalle
│   ├── public/
│   ├── dist/                    # Build de producción
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
├── nginx/
│   └── nginx.conf               # Configuración Nginx
│
├── docker-compose.simple.yml    # Orquestación Docker
└── README.md                    # Esta documentación
```

---

## 🔐 Seguridad

### Autenticación

- **Bearer Token** en webhook (SHA256 de 64 caracteres)
- Validación en backend antes de procesar alertas
- Sin acceso directo a PostgreSQL desde fuera de la red Docker

### Buenas Prácticas

1. **Cambiar WEBHOOK_SECRET** a un valor único:
```bash
openssl rand -hex 32
```

2. **PostgreSQL password** seguro en producción

3. **HTTPS con SSL/TLS** en producción (usar reverse proxy adicional)

4. **Firewall** - Solo puerto 8080 accesible desde Grafana

5. **Logs** - Monitorear accesos no autorizados:
```bash
docker logs backend | grep "Unauthorized"
```

### Hardening Recomendado

- Nginx rate limiting
- PostgreSQL backup automático
- Rotación de logs
- Monitoreo de recursos con Prometheus/Grafana

---

## 🔧 Mantenimiento

### Backups de Base de Datos

```bash
# Backup manual
docker exec postgres pg_dump -U alertero alertero > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i postgres psql -U alertero alertero < backup_20260202.sql
```

### Logs

```bash
# Ver logs en tiempo real
docker logs -f backend
docker logs -f nginx

# Logs de PostgreSQL
docker logs postgres

# Exportar logs
docker logs backend > backend.log 2>&1
```

### Actualización de Componentes

```bash
# Actualizar frontend
cd /opt/alertero/frontend
npm install
npm run build
docker restart nginx

# Actualizar backend
cd /opt/alertero/backend
docker build --no-cache -t alertero-backend .
docker restart backend

# Actualizar PostgreSQL (con backup previo!)
docker-compose -f docker-compose.simple.yml pull postgres
docker-compose -f docker-compose.simple.yml up -d postgres
```

### Limpiar Alertas Antiguas

```sql
-- Eliminar alertas resueltas con más de 30 días
DELETE FROM alerts_current 
WHERE status = 'resolved' 
AND ends_at < NOW() - INTERVAL '30 days';

-- Limpiar eventos antiguos (mantener 90 días)
DELETE FROM alert_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Monitoreo de Recursos

```bash
# Uso de contenedores
docker stats

# Espacio en disco
du -sh /var/lib/docker/volumes/alertero_postgres_data

# Conexiones a PostgreSQL
docker exec postgres psql -U alertero -d alertero -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 📊 Estadísticas del Sistema

**Información del Servidor:**
- **Hostname:** CGSNOCPRBE001
- **IP:** <SERVER_IP>
- **Puerto:** 8080
- **URL:** http://<SERVER_IP>:8080

**Capacidad:**
- Base de datos escalable
- Soporte para miles de alertas concurrentes
- Auto-refresh cada 30 segundos
- Responsive design (desktop/tablet/mobile)

---

## 🤝 Soporte y Contacto

**Desarrollado para:** Centro de Operaciones de Red (NOC)

**Fecha de Implementación:** Febrero 2026

**Stack Version:**
- Python 3.12
- FastAPI (latest)
- React 18.3
- PostgreSQL 16
- Nginx Alpine

---

## 📝 Changelog

### v1.0.0 - Feb 2026
- ✅ Implementación inicial
- ✅ Integración con Grafana webhook
- ✅ Dashboard profesional NOC/SOC
- ✅ Sistema de reconocimiento (ACK)
- ✅ Modal popup para detalles
- ✅ Filtrado y búsqueda avanzada
- ✅ Color-coding por equipos
- ✅ Modo oscuro
- ✅ Auto-refresh
- ✅ Historial de eventos

---

## 📄 Licencia

Este proyecto es de uso interno para operaciones NOC/SOC.

---

**🚨 Alertero - Professional Alert Dashboard** | Powered by FastAPI + React + PostgreSQL
