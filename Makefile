## Dockerized dev commands.
##
## Runs every npm script inside a throwaway node:24-alpine container (same
## major version as backend/Dockerfile and frontend/Dockerfile) so nobody
## needs Node/npm installed on the host to work on this repo, only Docker.
##
## node_modules live in a named volume instead of being written into the
## host checkout: keeps host/container installs from clobbering each other
## (native deps compiled for the container's arch vs. the host's) and
## survives `make *-install` reruns.
##
## Postgres (via `docker compose`) publishes 5432 to the host, so containers
## started here reach it through host.docker.internal rather than joining
## the compose network by name.

.PHONY: help \
	install backend-install frontend-install \
	backend-dev backend-build backend-lint backend-lint-check backend-format \
	backend-test backend-test-watch backend-test-cov backend-test-e2e \
	backend-db-generate backend-db-push backend-npm \
	frontend-dev frontend-build frontend-preview \
	frontend-lint frontend-lint-check frontend-npm \
	db-up db-down db-logs up down logs clean

NODE_IMAGE := node:24-alpine

BACKEND_MODULES_VOLUME := cbyte-backend-node-modules
FRONTEND_MODULES_VOLUME := cbyte-frontend-node-modules

# DATABASE_URL as seen from inside the ad hoc containers below (backend/.env
# points at localhost:5432 for non-Docker local dev, which doesn't resolve
# to the compose Postgres from inside a container).
DEV_DATABASE_URL := postgres://cbyte:Cbyteiscool@host.docker.internal:5432/password_sharing

# -it only when make itself has a real terminal attached (a plain terminal
# run), otherwise -i so this still works from scripts/CI/non-tty shells.
DOCKER_TTY := $(shell [ -t 0 ] && echo -it || echo -i)

# Port publishing lives only on the *-dev variants below: binding it on every
# target (install/lint/test/build/...) means those fail whenever the real
# stack, or another dev command, already holds the port.
BACKEND_RUN_BASE = docker run --rm $(DOCKER_TTY) \
	--add-host=host.docker.internal:host-gateway \
	-v "$(CURDIR)/backend:/app" \
	-v "$(BACKEND_MODULES_VOLUME):/app/node_modules" \
	-w /app \
	--env-file "$(CURDIR)/backend/.env" \
	-e DATABASE_URL="$(DEV_DATABASE_URL)" \
	-e PORT=3000

RUN_BACKEND = $(BACKEND_RUN_BASE) $(NODE_IMAGE)
RUN_BACKEND_DEV = $(BACKEND_RUN_BASE) -p 3000:3000 $(NODE_IMAGE)

FRONTEND_RUN_BASE = docker run --rm $(DOCKER_TTY) \
	-v "$(CURDIR)/frontend:/app" \
	-v "$(FRONTEND_MODULES_VOLUME):/app/node_modules" \
	-w /app

RUN_FRONTEND = $(FRONTEND_RUN_BASE) $(NODE_IMAGE)
RUN_FRONTEND_DEV = $(FRONTEND_RUN_BASE) -p 5173:5173 $(NODE_IMAGE)

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

## --- Setup ---

install: backend-install frontend-install ## Install deps for both projects

backend-install: ## npm install (backend)
	$(RUN_BACKEND) npm install

frontend-install: ## npm install (frontend)
	$(RUN_FRONTEND) npm install

## --- Backend ---

backend-dev: db-up ## Run backend in watch mode on :3000 (needs backend/.env, see README)
	$(RUN_BACKEND_DEV) npm run start:dev

backend-build: ## Build backend
	$(RUN_BACKEND) npm run build

backend-lint: ## Lint backend, autofix
	$(RUN_BACKEND) npm run lint

backend-lint-check: ## Lint backend, check only (what CI runs)
	$(RUN_BACKEND) npm run lint:check

backend-format: ## Prettier-format backend
	$(RUN_BACKEND) npm run format

backend-test: ## Unit tests (backend)
	$(RUN_BACKEND) npm test

backend-test-watch: ## Unit tests, watch mode (backend)
	$(RUN_BACKEND) npm run test:watch

backend-test-cov: ## Unit tests with coverage (backend)
	$(RUN_BACKEND) npm run test:cov

backend-test-e2e: db-up ## e2e tests against Postgres (backend)
	$(RUN_BACKEND) npm run test:e2e

backend-db-generate: db-up ## Generate a drizzle migration from schema.ts
	$(RUN_BACKEND) npm run db:generate

backend-db-push: db-up ## Push schema.ts to Postgres directly (dev shortcut)
	$(RUN_BACKEND) npm run db:push

backend-npm: ## Run an arbitrary backend npm command, e.g. make backend-npm CMD="run test:cov"
	$(RUN_BACKEND) npm $(CMD)

## --- Frontend ---

frontend-dev: ## Run frontend dev server on :5173
	$(RUN_FRONTEND_DEV) npm run dev -- --host 0.0.0.0

frontend-build: ## Build frontend
	$(RUN_FRONTEND) npm run build

frontend-preview: ## Preview a production frontend build on :5173
	$(RUN_FRONTEND_DEV) npm run preview -- --host 0.0.0.0

frontend-lint: ## Lint frontend, autofix
	$(RUN_FRONTEND) npm run lint

frontend-lint-check: ## Lint frontend, check only (what CI runs)
	$(RUN_FRONTEND) npm run lint:check

frontend-npm: ## Run an arbitrary frontend npm command, e.g. make frontend-npm CMD="run build"
	$(RUN_FRONTEND) npm $(CMD)

## --- Full stack (docker compose) ---

db-up: ## Start just Postgres
	docker compose up -d postgres

db-down: ## Stop Postgres
	docker compose stop postgres

db-logs: ## Tail Postgres logs
	docker compose logs -f postgres

up: ## Start the full stack (postgres + backend + frontend)
	docker compose up -d --build

down: ## Stop the full stack
	docker compose down

logs: ## Tail all compose logs
	docker compose logs -f

clean: ## Remove node_modules volumes (forces a clean reinstall)
	docker volume rm -f $(BACKEND_MODULES_VOLUME) $(FRONTEND_MODULES_VOLUME)
