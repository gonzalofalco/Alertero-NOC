# Alertero - Estructura del Proyecto

## Árbol de archivos con paths absolutos

```
/opt/alertero/                                    # ROOT del proyecto
├── /opt/alertero/.env                            # Config producción (PG pass, webhook secret, CORS)
├── /opt/alertero/.env.example                    # Template de configuración
├── /opt/alertero/.gitignore
├── /opt/alertero/docker-compose.yml              # 3 servicios: postgres, backend, nginx
├── /opt/alertero/docker-compose.simple.yml
├── /opt/alertero/Makefile                        # Comandos: up, down, logs, migrate, backup, psql
├── /opt/alertero/README.md
├── /opt/alertero/ARCHITECTURE.md
├── /opt/alertero/REFACTOR_SUMMARY.md
│
├── /opt/alertero/backend/                        # Python FastAPI (puerto 8000)
│   ├── /opt/alertero/backend/Dockerfile          # Python 3.12-slim, alembic + uvicorn
│   ├── /opt/alertero/backend/requirements.txt    # fastapi, sqlalchemy, alembic, psycopg2, pydantic
│   ├── /opt/alertero/backend/pyproject.toml
│   │
│   ├── /opt/alertero/backend/alembic/                              # Migraciones de BD
│   │   ├── /opt/alertero/backend/alembic.ini
│   │   ├── /opt/alertero/backend/alembic/env.py
│   │   ├── /opt/alertero/backend/alembic/script.py.mako
│   │   └── /opt/alertero/backend/alembic/versions/
│   │       ├── .../versions/001_initial_schema.py                  # alerts_current + alert_events
│   │       ├── .../versions/002_add_incidents_table.py             # incidents
│   │       └── .../versions/003_add_incident_updates_table.py      # incident_updates
│   │
│   ├── /opt/alertero/backend/app/
│   │   ├── /opt/alertero/backend/app/main.py                      # Entry point FastAPI - lifespan, CORS, middlewares
│   │   │
│   │   ├── /opt/alertero/backend/app/core/                        # Configuración central
│   │   │   ├── /opt/alertero/backend/app/core/config.py           #   Settings pydantic-settings (DB, CORS, logging)
│   │   │   └── /opt/alertero/backend/app/core/logging.py          #   Logging con request_id tracking
│   │   │
│   │   ├── /opt/alertero/backend/app/db/                          # Capa de base de datos
│   │   │   ├── /opt/alertero/backend/app/db/base.py               #   Base declarativa SQLAlchemy
│   │   │   ├── /opt/alertero/backend/app/db/session.py            #   Engine + SessionLocal + get_db
│   │   │   └── /opt/alertero/backend/app/db/models/
│   │   │       ├── /opt/alertero/backend/app/db/models/alert.py   #   AlertCurrent + AlertEvent
│   │   │       ├── /opt/alertero/backend/app/db/models/incident.py#   Incident + IncidentUpdate (1:N)
│   │   │       └── /opt/alertero/backend/app/db/models/silence.py #   Silence (matchers JSON)
│   │   │
│   │   ├── /opt/alertero/backend/app/schemas/                     # Pydantic schemas (validación I/O)
│   │   │   ├── /opt/alertero/backend/app/schemas/alert.py         #   GrafanaWebhookPayload, AlertCurrentResponse, AlertFilterParams, AlertAckRequest, AlertStatsResponse
│   │   │   ├── /opt/alertero/backend/app/schemas/incident.py      #   IncidentCreate/Finalize/UpdateCreate, IncidentResponse
│   │   │   ├── /opt/alertero/backend/app/schemas/silence.py       #   SilenceCreate/Update/Response
│   │   │   └── /opt/alertero/backend/app/schemas/common.py        #   HealthResponse, WebhookResponse
│   │   │
│   │   ├── /opt/alertero/backend/app/api/v1/                      # API v1
│   │   │   ├── /opt/alertero/backend/app/api/v1/__init__.py       #   api_router que monta todos los routers
│   │   │   └── /opt/alertero/backend/app/api/v1/routers/
│   │   │       ├── .../routers/webhook.py                         #   POST /webhook/grafana (auth X-Webhook-Secret o Bearer)
│   │   │       ├── .../routers/alerts.py                          #   GET /alerts/current, POST/DELETE /{fp}/ack, GET /alerts/stats
│   │   │       ├── .../routers/incidents.py                       #   GET /incidents/active, GET/POST /incidents, POST /{id}/finalize, POST /{id}/updates
│   │   │       ├── .../routers/silences.py                        #   CRUD /silences
│   │   │       ├── .../routers/health.py                          #   GET /health
│   │   │       └── .../routers/maintenance.py                     #   POST /maintenance/auto-resolve-stale
│   │   │
│   │   ├── /opt/alertero/backend/app/services/                    # Lógica de negocio
│   │   │   ├── /opt/alertero/backend/app/services/alerts_service.py    # process_webhook, list/ack/unack/stats
│   │   │   ├── /opt/alertero/backend/app/services/incidents_service.py # get_active, create, finalize, add_update
│   │   │   └── /opt/alertero/backend/app/services/silences_service.py  # CRUD silences
│   │   │
│   │   ├── /opt/alertero/backend/app/repositories/                # Acceso a datos (SQLAlchemy queries)
│   │   │   ├── /opt/alertero/backend/app/repositories/alerts_repo.py    # CRUD AlertCurrent/AlertEvent, filtros, stats
│   │   │   ├── /opt/alertero/backend/app/repositories/incidents_repo.py # CRUD Incident/IncidentUpdate
│   │   │   └── /opt/alertero/backend/app/repositories/silences_repo.py  # CRUD Silence
│   │   │
│   │   ├── /opt/alertero/backend/app/utils/
│   │   │   └── /opt/alertero/backend/app/utils/alerts.py          # fingerprint, extract_*, parse_annotations, match_silence
│   │   │
│   │   └── /opt/alertero/backend/app/dependencies/
│   │       └── /opt/alertero/backend/app/dependencies/db.py       #   get_db re-export
│   │
│   └── /opt/alertero/backend/tests/
│       ├── /opt/alertero/backend/tests/conftest.py                #   Fixtures pytest (SQLite in-memory)
│       ├── /opt/alertero/backend/tests/test_alerts.py
│       └── /opt/alertero/backend/tests/test_health.py
│
├── /opt/alertero/frontend/                       # React + Vite + TailwindCSS
│   ├── /opt/alertero/frontend/package.json       # react 18, axios, vite 5, tailwindcss 3
│   ├── /opt/alertero/frontend/vite.config.js     # Proxy /api -> backend:8000, build -> dist/
│   ├── /opt/alertero/frontend/tailwind.config.js
│   ├── /opt/alertero/frontend/postcss.config.js
│   ├── /opt/alertero/frontend/index.html         # Entry HTML
│   │
│   └── /opt/alertero/frontend/src/
│       ├── /opt/alertero/frontend/src/main.jsx              # ReactDOM.createRoot
│       ├── /opt/alertero/frontend/src/index.css             # Tailwind + custom CSS (animaciones wave, ticker)
│       ├── /opt/alertero/frontend/src/api.js                # Axios client: alertsApi, silencesApi, incidentsApi, healthApi
│       ├── /opt/alertero/frontend/src/App.jsx               # App principal - tabs, state, fetch loops (5s)
│       │                                                    #   Tabs: Alertas | Seguimiento | Deepfield (prox) | Incidentes | Historial (prox)
│       │                                                    #   Features: dark mode, card/table, filtros, incident ticker
│       │
│       └── /opt/alertero/frontend/src/components/
│           ├── /opt/alertero/frontend/src/components/Dashboard.jsx            # Panel stats (firing, critical, warning, by team)
│           ├── /opt/alertero/frontend/src/components/AlertCard.jsx            # Tarjeta alerta (severity color, labels, time)
│           ├── /opt/alertero/frontend/src/components/AlertCardSeguimiento.jsx # Tarjeta alertas acknowledged
│           ├── /opt/alertero/frontend/src/components/AlertDetail.jsx          # Modal detalle (labels, annotations, ack)
│           ├── /opt/alertero/frontend/src/components/AlertsTable.jsx          # Vista tabla con getTimeAgo
│           ├── /opt/alertero/frontend/src/components/Filters.jsx              # Filtros
│           └── /opt/alertero/frontend/src/components/IncidentCard.jsx         # Gestion incidentes (crear, updates, finalizar)
│
├── /opt/alertero/nginx/                          # Reverse proxy
│   ├── /opt/alertero/nginx/alertero.conf         # Rate limiting (webhook 10r/s, api 30r/s)
│   ├── /opt/alertero/nginx/locations.conf        # /api -> backend, / -> frontend dist
│   └── /opt/alertero/nginx/nginx.conf
│
├── /opt/alertero/scripts/                        # Scripts operativos
│   ├── /opt/alertero/scripts/bootstrap.sh        # Setup inicial
│   ├── /opt/alertero/scripts/backup.sh           # Backup PostgreSQL
│   ├── /opt/alertero/scripts/restore.sh          # Restore backup
│   └── /opt/alertero/scripts/verify_refactor.sh
│
├── /opt/alertero/systemd/
│   └── /opt/alertero/systemd/alertero.service    # Servicio systemd para docker compose
│
├── /opt/alertero/docs/
│   ├── /opt/alertero/docs/GRAFANA_WEBHOOK.md     # Config webhook Grafana
│   ├── /opt/alertero/docs/QUICKSTART.md
│   └── /opt/alertero/docs/SETUP_UBUNTU.md
│
└── /opt/alertero/.github/workflows/
    └── /opt/alertero/.github/workflows/ci.yml    # CI pipeline
```

---

## Arquitectura (Clean Architecture)

```
Grafana -> POST /webhook/grafana (auth) -> AlertService.process_webhook()
                                              ├── generate_fingerprint(labels)
                                              ├── extract_severity/team/instance
                                              ├── check silences (matchers)
                                              ├── UPSERT alerts_current (estado)
                                              └── INSERT alert_events (historial)

Frontend (React) <-> Nginx (:8080) <-> Backend FastAPI (:8000)
         │                                    │
         │ polling 5s                         ├── /api/v1/alerts/current
         │                                    ├── /api/v1/alerts/stats
         │                                    ├── /api/v1/incidents/*
         └── Tabs:                            └── /api/v1/silences/*
              ├── Alertas (cards/table)
              ├── Seguimiento (acked alerts)
              ├── Deepfield (proximamente)
              ├── Incidentes (crear/gestionar)
              └── Historial (proximamente)
```

---

## Base de datos (PostgreSQL 16)

| Tabla | Propósito |
|-------|-----------|
| `alerts_current` | Estado actual de cada alerta (upsert por fingerprint) - status, severity, labels, ack info, silenced |
| `alert_events` | Historial append-only de todos los eventos webhook |
| `incidents` | Incidentes operativos (title, message, is_active, created_by, finalized_by) |
| `incident_updates` | Actualizaciones de un incidente (FK -> incidents, message, created_by) |
| `silences` | Reglas de silenciamiento (matchers JSON, expires_at, active) |

---

## Volúmenes Docker (paths en host)

| Container | Path en host | Path en container |
|-----------|-------------|-------------------|
| postgres | `/var/lib/alertero/postgres` | `/var/lib/postgresql/data` |
| nginx | `/opt/alertero/nginx/alertero.conf` | `/etc/nginx/conf.d/default.conf` |
| nginx | `/opt/alertero/nginx/locations.conf` | `/etc/nginx/snippets/locations.conf` |
| nginx | `/opt/alertero/frontend/dist` | `/usr/share/nginx/html` |
| nginx | `/etc/alertero/secrets` | `/etc/nginx/ssl` |

---

## Puertos

| Servicio | Puerto interno | Puerto expuesto |
|----------|---------------|-----------------|
| Backend (FastAPI) | 8000 | No expuesto (solo via nginx) |
| Nginx | 80 | **8080** |
| PostgreSQL | 5432 | No expuesto |
| Vite dev server | 5173 | Solo desarrollo |

---

## Config externa

| Archivo | Path |
|---------|------|
| Env producción | `/etc/alertero/alertero.env` (leido por Makefile) |
| Certificados SSL | `/etc/alertero/secrets/` |
| Systemd service | `/etc/systemd/system/alertero.service` (copiado desde repo) |

---

## Stack tecnológico

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, psycopg2
- **Frontend**: React 18, Vite 5, TailwindCSS 3, Axios
- **DB**: PostgreSQL 16 Alpine
- **Proxy**: Nginx 1.25 Alpine (rate limiting, static files)
- **Deploy**: Docker Compose + systemd, journald logging

---

## Endpoints API

### Alertas
- `GET /api/v1/alerts/current` - Listar alertas con filtros (status, severity, team, alertname, show_acked, show_silenced)
- `GET /api/v1/alerts/stats` - Estadísticas (total, firing, resolved, critical, warning, info, by_team, by_severity)
- `POST /api/v1/alerts/current/{fingerprint}/ack` - Reconocer alerta
- `DELETE /api/v1/alerts/current/{fingerprint}/ack` - Quitar reconocimiento

### Webhook
- `POST /api/v1/webhook/grafana` - Recibir alertas de Grafana (auth: X-Webhook-Secret o Bearer)

### Incidentes
- `GET /api/v1/incidents/active` - Incidente activo actual (o null)
- `GET /api/v1/incidents` - Listar todos los incidentes
- `POST /api/v1/incidents` - Crear incidente (auto-finaliza el anterior)
- `POST /api/v1/incidents/{id}/finalize` - Finalizar incidente
- `POST /api/v1/incidents/{id}/updates` - Agregar update a incidente

### Silencios
- `GET /api/v1/silences` - Listar reglas de silencio
- `GET /api/v1/silences/{id}` - Obtener silencio por ID
- `POST /api/v1/silences` - Crear regla de silencio
- `PATCH /api/v1/silences/{id}` - Actualizar silencio
- `DELETE /api/v1/silences/{id}` - Eliminar (desactivar) silencio

### Mantenimiento
- `POST /api/v1/maintenance/auto-resolve-stale` - Auto-resolver alertas sin update en >12hs
- `GET /api/v1/maintenance/check-stale` - Verificar alertas stale

### Health
- `GET /api/v1/health` - Health check (API + DB)
