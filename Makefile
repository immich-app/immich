DOCKER_COMPOSE_FILE := docker/docker-compose.yml

.PHONY: dev dev-down open-api open-api-dart open-api-typescript \
        build-server build-web test-server test-medium test-e2e \
        lint-server lint-web format

# Full development environment
dev:
	@echo "Starting Docker services (Postgres 18 + Redis)..."
	docker compose -f $(DOCKER_COMPOSE_FILE) up -d
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@echo "Starting web dev server (background)..."
	pnpm --filter web dev &
	@echo "Starting NestJS server with hot reload..."
	pnpm --filter immich start:dev

dev-down:
	docker compose -f $(DOCKER_COMPOSE_FILE) down --remove-orphans
	@-pkill -f "nest start" 2>/dev/null || true
	@-pkill -f "vite dev" 2>/dev/null || true
	@echo "All services stopped."

# OpenAPI SDK generation
open-api:
	./open-api/bin/generate-open-api.sh

open-api-dart:
	cd open-api && npx --yes @openapitools/openapi-generator-cli generate -g dart -i ../server/immich-openapi-specs.json -o ../mobile/openapi

open-api-typescript:
	cd open-api && npx --yes oazapfts ../server/immich-openapi-specs.json --optimistic > typescript-sdk/src/fetch-client.ts

# Build targets
build-server:
	pnpm --filter immich build

build-web:
	pnpm --filter web build

# Test targets
test-server:
	pnpm --filter immich test

test-medium:
	pnpm --filter immich test:medium

test-e2e:
	pnpm --filter immich-e2e test

# Lint & format
lint-server:
	pnpm --filter immich lint

lint-web:
	pnpm --filter web lint

format:
	pnpm format

# Install dependencies
install:
	pnpm install

# Clean everything
clean:
	docker compose -f $(DOCKER_COMPOSE_FILE) down -v --remove-orphans
	rm -rf node_modules server/node_modules web/node_modules e2e/node_modules
