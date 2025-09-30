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

attach-server:
	docker exec -it docker_immich-server_1 sh

renovate:
  LOG_LEVEL=debug npx renovate --platform=local --repository-cache=reset

# Directories that need to be created for volumes or build output
VOLUME_DIRS = \
	./.pnpm-store \
	./web/.svelte-kit \
	./web/node_modules \
	./web/coverage \
	./e2e/node_modules \
	./docs/node_modules \
	./server/node_modules \
	./open-api/typescript-sdk/node_modules \
	./.github/node_modules \
	./node_modules \
	./cli/node_modules

# Include .env file if it exists
-include docker/.env

MODULES = e2e server web cli sdk docs .github

# directory to package name mapping function
#   cli     = @immich/cli
#   docs    = documentation
#   e2e     = immich-e2e
#   open-api/typescript-sdk = @immich/sdk
#   server  = immich
#   web     = immich-web
map-package = $(subst sdk,@immich/sdk,$(subst cli,@immich/cli,$(subst docs,documentation,$(subst e2e,immich-e2e,$(subst server,immich,$(subst web,immich-web,$1))))))

audit-%:
	pnpm --filter $(call map-package,$*) audit fix
install-%:
	pnpm --filter $(call map-package,$*) install $(if $(FROZEN),--frozen-lockfile) $(if $(OFFLINE),--offline)
build-cli: build-sdk
build-web: build-sdk
build-%: install-%
	pnpm --filter $(call map-package,$*) run build
format-%:
	pnpm --filter $(call map-package,$*) run format:fix
lint-%:
	pnpm --filter $(call map-package,$*) run lint:fix
lint-web:
	pnpm --filter $(call map-package,$*) run lint:p
check-%:
	pnpm --filter $(call map-package,$*) run check
check-web:
	pnpm --filter immich-web run check:typescript
	pnpm --filter immich-web run check:svelte
test-%:
	pnpm --filter $(call map-package,$*) run test
test-e2e:
	docker compose -f ./e2e/docker-compose.yml build
	pnpm --filter immich-e2e run test
	pnpm --filter immich-e2e run test:web
test-medium:
	docker run \
    --rm \
    -v ./server/src:/usr/src/app/src \
    -v ./server/test:/usr/src/app/test \
    -v ./server/vitest.config.medium.mjs:/usr/src/app/vitest.config.medium.mjs \
    -v ./server/tsconfig.json:/usr/src/app/tsconfig.json \
    -e NODE_ENV=development \
    immich-server:latest \
    -c "pnpm test:medium -- --run"
test-medium-dev:
	docker exec -it immich_server /bin/sh -c "pnpm run test:medium"

install-all:
	pnpm -r --filter '!documentation' install

build-all: $(foreach M,$(filter-out e2e docs .github,$(MODULES)),build-$M) ;

check-all:
	pnpm -r --filter '!documentation' run "/^(check|check\:svelte|check\:typescript)$/"
lint-all:
	pnpm -r --filter '!documentation' run lint:fix
format-all:
	pnpm -r --filter '!documentation' run format:fix
audit-all:
	pnpm -r --filter '!documentation' audit fix
hygiene-all: audit-all
	pnpm -r --filter '!documentation' run "/(format:fix|check|check:svelte|check:typescript|sql)/"

test-all:
	pnpm -r --filter '!documentation' run "/^test/"

clean:
	find . -name "node_modules" -type d -prune -exec rm -rf {} +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +
	find . -name ".svelte-kit" -type d -prune -exec rm -rf '{}' +
	find . -name "coverage" -type d -prune -exec rm -rf '{}' +
	find . -name ".pnpm-store" -type d -prune -exec rm -rf '{}' +
	command -v docker >/dev/null 2>&1 && docker compose -f ./docker/docker-compose.dev.yml down -v --remove-orphans || true
	command -v docker >/dev/null 2>&1 && docker compose -f ./e2e/docker-compose.yml down -v --remove-orphans || true


setup-server-dev: install-server
setup-web-dev: install-sdk build-sdk install-web
