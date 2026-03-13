.PHONY: help up down restart logs logs-backend logs-nginx logs-postgres health migrate backup restore shell-backend psql install-systemd clean

ENV_FILE=/etc/alertero/.env

help: ## Mostrar esta ayuda
@echo "Alertero - Comandos disponibles:"
@echo ""
@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Levantar todos los servicios
@if [ ! -f $(ENV_FILE) ]; then \
echo "ERROR: $(ENV_FILE) no existe. Copiar desde .env.example"; \
exit 1; \
fi
@export $$(cat $(ENV_FILE) | xargs) && docker compose up -d
@echo "✓ Servicios levantados. Ejecutar 'make logs' para ver logs"

down: ## Detener todos los servicios
@docker compose down

restart: ## Reiniciar todos los servicios
@docker compose restart

logs: ## Ver logs de todos los servicios
@docker compose logs -f

logs-backend: ## Ver logs del backend
@docker compose logs -f backend

logs-nginx: ## Ver logs de Nginx
@docker compose logs -f nginx

logs-postgres: ## Ver logs de PostgreSQL
@docker compose logs -f postgres

health: ## Verificar health de todos los servicios
@echo "Verificando health de servicios..."
@echo ""
@echo "=== PostgreSQL ==="
@docker compose exec -T postgres pg_isready -U alertero || echo "❌ PostgreSQL NO disponible"
@echo ""
@echo "=== Backend API ==="
@curl -s http://localhost:8000/api/health | jq . || echo "❌ Backend NO disponible"
@echo ""
@echo "=== Nginx ==="
@curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/health || echo "❌ Nginx NO disponible"

migrate: ## Ejecutar migraciones de BD
@echo "Ejecutando migraciones de Alembic..."
@docker compose exec -T backend alembic upgrade head
@echo "✓ Migraciones completadas"

shell-backend: ## Abrir shell en contenedor backend
@docker compose exec backend /bin/bash

psql: ## Conectar a PostgreSQL
@docker compose exec postgres psql -U alertero -d alertero

backup: ## Crear backup de PostgreSQL
@echo "Creando backup de PostgreSQL..."
@./scripts/backup.sh
@echo "✓ Backup completado. Ver /var/lib/alertero/backups/"

restore: ## Restaurar backup (usar: make restore BACKUP=<archivo>)
@if [ -z "$(BACKUP)" ]; then \
echo "ERROR: Especificar archivo de backup"; \
echo "Uso: make restore BACKUP=/var/lib/alertero/backups/alertero_YYYYMMDD_HHMMSS.sql.gz"; \
exit 1; \
fi
@./scripts/restore.sh $(BACKUP)

install-systemd: ## Instalar y habilitar servicio systemd
@echo "Instalando servicio systemd..."
@sudo cp systemd/alertero.service /etc/systemd/system/
@sudo systemctl daemon-reload
@sudo systemctl enable alertero.service
@echo "✓ Servicio instalado y habilitado"
@echo "Comandos útiles:"
@echo "  sudo systemctl start alertero"
@echo "  sudo systemctl status alertero"
@echo "  journalctl -u alertero -f"

build: ## Rebuild de todos los contenedores
@export $$(cat $(ENV_FILE) | xargs) && docker compose build

rebuild: ## Rebuild y restart
@export $$(cat $(ENV_FILE) | xargs) && docker compose up -d --build

clean: ## Limpiar contenedores y volúmenes (¡CUIDADO!)
@echo "ADVERTENCIA: Esto eliminará todos los contenedores y volúmenes."
@read -p "¿Continuar? [y/N] " -n 1 -r; \
echo; \
if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
docker compose down -v; \
echo "✓ Limpieza completada"; \
else \
echo "Cancelado"; \
fi
