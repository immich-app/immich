dev:
	@trap 'make dev-down' EXIT; COMPOSE_BAKE=true docker compose -f ./docker/docker-compose.dev.yml up --remove-orphans

dev-down:
	docker compose -f ./docker/docker-compose.dev.yml down --remove-orphans

dev-update:
	@trap 'make dev-down' EXIT; COMPOSE_BAKE=true docker compose -f ./docker/docker-compose.dev.yml up --build -V --remove-orphans

dev-scale:
	@trap 'make dev-down' EXIT; COMPOSE_BAKE=true docker compose -f ./docker/docker-compose.dev.yml up --build -V --scale immich-server=3 --remove-orphans

dev-docs:
	npm --prefix docs run start

.PHONY: e2e
e2e:
	@trap 'make e2e-down' EXIT; COMPOSE_BAKE=true docker compose -f ./e2e/docker-compose.yml up --remove-orphans

e2e-dev:
	@trap 'make e2e-down' EXIT; COMPOSE_BAKE=true docker compose -f ./e2e/docker-compose.dev.yml up --remove-orphans

e2e-update:
	@trap 'make e2e-down' EXIT; COMPOSE_BAKE=true docker compose -f ./e2e/docker-compose.yml up --build -V --remove-orphans

e2e-down:
	docker compose -f ./e2e/docker-compose.yml down --remove-orphans

prod:
	@trap 'make prod-down' EXIT; COMPOSE_BAKE=true docker compose -f ./docker/docker-compose.prod.yml up --build -V --remove-orphans

prod-down:
	docker compose -f ./docker/docker-compose.prod.yml down --remove-orphans

prod-scale:
	@trap 'make prod-down' EXIT; COMPOSE_BAKE=true docker compose -f ./docker/docker-compose.prod.yml up --build -V --scale immich-server=3 --scale immich-microservices=3 --remove-orphans

.PHONY: open-api
open-api:
	cd ./open-api && bash ./bin/generate-open-api.sh

open-api-dart:
	cd ./open-api && bash ./bin/generate-open-api.sh dart

open-api-typescript:
	cd ./open-api && bash ./bin/generate-open-api.sh typescript

sql:
	pnpm --filter immich run sync:sql

renovate:
  LOG_LEVEL=debug pnpm exec renovate --platform=local --repository-cache=reset

# Include .env file if it exists
-include docker/.env

MODULES = e2e server web cli sdk docs .github

test-e2e:
	docker compose -f ./e2e/docker-compose.yml build
	pnpm --filter immich-e2e run test
	pnpm --filter immich-e2e run test:web

clean:
	find . -name "node_modules" -type d -prune -exec rm -rf {} +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +
	find . -name ".svelte-kit" -type d -prune -exec rm -rf '{}' +
	find . -name "coverage" -type d -prune -exec rm -rf '{}' +
	find . -name ".pnpm-store" -type d -prune -exec rm -rf '{}' +
	command -v docker >/dev/null 2>&1 && docker compose -f ./docker/docker-compose.dev.yml down -v --remove-orphans || true
	command -v docker >/dev/null 2>&1 && docker compose -f ./e2e/docker-compose.yml down -v --remove-orphans || true
