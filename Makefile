.PHONY: help dev up down restart db-migrate db-studio db-push lint check format prod-config prod-build prod-deploy prod-deploy-skip-build prod-deploy-prune prod-up prod-down prod-restart prod-ps prod-logs prod-logs-webapp prod-logs-nginx prod-logs-db prod-health prod-nginx-test prod-migrate prod-shell-webapp prod-shell-nginx prod-shell-db prod-backup prod-restore

# Standard-Target: Zeigt die Hilfe an
.DEFAULT_GOAL := help

PROD_ENV := .env.prod
PROD_COMPOSE_FILE := docker-compose.prod.yml
PROD_COMPOSE := docker compose --env-file $(PROD_ENV) -f $(PROD_COMPOSE_FILE)

help:
	@echo "========================================================================"
	@echo "    SC ORGA TOOLBOX - AVAILABLE COMMANDS"
	@echo "========================================================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-27s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Lokale Entwicklung
# ---------------------------------------------------------------------------

dev: ## Startet den Next.js-Entwicklungsserver
	npm run dev

up: ## Startet die lokalen Docker-Container im Hintergrund
	docker compose up -d

down: ## Stoppt die lokalen Docker-Container
	docker compose down

restart: ## Startet die lokalen Docker-Container neu
	docker compose down
	docker compose up -d

db-migrate: ## Erstellt eine Prisma-Migration (NAME=add_roles)
	@test -n "$(NAME)" || (echo "NAME fehlt. Beispiel: make db-migrate NAME=add_roles" && exit 1)
	npx prisma migrate dev --name "$(NAME)"

db-push: ## Überträgt das Prisma-Schema ohne Migration in die lokale DB
	npx prisma db push

db-studio: ## Startet Prisma Studio auf Port 5555
	npx prisma studio --port 5555

lint: ## Überprüft den Code mit ESLint
	npm run lint

check: ## Führt alle Qualitätsprüfungen aus
	npm run lint
	npx tsc --noEmit
	npx prisma validate

format: ## Formatiert das gesamte Projekt mit Prettier
	npx prettier --write .

# ---------------------------------------------------------------------------
# Production – Validierung und Deployment
# ---------------------------------------------------------------------------

prod-config: ## Validiert die Production-Compose-Konfiguration
	$(PROD_COMPOSE) config --quiet
	@echo "Production-Compose-Konfiguration ist gültig."

prod-build: ## Baut die Production-Docker-Images
	$(PROD_COMPOSE) build

prod-deploy: ## Führt das vollständige Production-Deployment aus
	./scripts/deploy.sh

prod-deploy-skip-build: ## Deployt mit bereits vorhandenen Docker-Images
	./scripts/deploy.sh --skip-build

prod-deploy-prune: ## Deployt und entfernt danach ungenutzte Docker-Images
	./scripts/deploy.sh --prune

# ---------------------------------------------------------------------------
# Production – Containerbetrieb
# ---------------------------------------------------------------------------

prod-up: ## Startet DB, Webapp und Nginx ohne Migration
	$(PROD_COMPOSE) up -d db webapp nginx

prod-down: ## Stoppt den Production-Stack, Datenbank-Volume bleibt erhalten
	$(PROD_COMPOSE) down

prod-restart: ## Startet Webapp und Nginx neu
	$(PROD_COMPOSE) restart webapp nginx

prod-ps: ## Zeigt den Status der Production-Container
	$(PROD_COMPOSE) ps

# ---------------------------------------------------------------------------
# Production – Logs und Diagnose
# ---------------------------------------------------------------------------

prod-logs: ## Verfolgt die Logs aller Production-Services
	$(PROD_COMPOSE) logs --tail=100 -f

prod-logs-webapp: ## Verfolgt die Webapp-Logs
	$(PROD_COMPOSE) logs --tail=100 -f webapp

prod-logs-nginx: ## Verfolgt die Nginx-Logs
	$(PROD_COMPOSE) logs --tail=100 -f nginx

prod-logs-db: ## Verfolgt die MariaDB-Logs
	$(PROD_COMPOSE) logs --tail=100 -f db

prod-health: ## Prüft die Anwendung über den veröffentlichten Nginx-Port
	@address="$$( $(PROD_COMPOSE) port nginx 80 )"; \
	if [ -z "$$address" ]; then \
		echo "Der veröffentlichte Nginx-Port konnte nicht ermittelt werden."; \
		exit 1; \
	fi; \
	echo "Prüfe http://$$address/api/health"; \
	curl --fail --show-error "http://$$address/api/health"; \
	echo; \
	echo "Production-Healthcheck erfolgreich."

prod-nginx-test: ## Validiert die Nginx-Konfiguration
	$(PROD_COMPOSE) run --rm --no-deps nginx nginx -t

# ---------------------------------------------------------------------------
# Production – Datenbank
# ---------------------------------------------------------------------------

prod-migrate: ## Führt die Production-Datenbankmigrationen aus
	$(PROD_COMPOSE) up -d db
	$(PROD_COMPOSE) run --rm migrate

prod-shell-webapp: ## Öffnet eine Shell im Webapp-Container
	$(PROD_COMPOSE) exec webapp sh

prod-shell-nginx: ## Öffnet eine Shell im Nginx-Container
	$(PROD_COMPOSE) exec nginx sh

prod-shell-db: ## Öffnet den MariaDB-Client
	$(PROD_COMPOSE) exec db sh -c 'exec mariadb -u"$$MARIADB_USER" -p"$$MARIADB_PASSWORD" "$$MARIADB_DATABASE"'

prod-backup: ## Erstellt ein Production-Datenbankbackup
	./scripts/backup-db.sh

prod-restore: ## Stellt ein Backup wieder her (FILE=... CONFIRM=YES)
	@test -n "$(FILE)" || (echo "FILE fehlt. Beispiel: make prod-restore FILE=backups/backup.sql.gz CONFIRM=YES" && exit 1)
	@test "$(CONFIRM)" = "YES" || (echo "Restore nicht bestätigt. Ergänze CONFIRM=YES." && exit 1)
	CONFIRM_RESTORE=YES ./scripts/restore-db.sh "$(FILE)"
