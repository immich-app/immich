dev:
	docker compose -f ./docker/docker-compose.dev.yml up --remove-orphans || make dev-down

dev-down:
	docker compose -f ./docker/docker-compose.dev.yml down --remove-orphans

dev-update:
	docker compose -f ./docker/docker-compose.dev.yml up --build -V --remove-orphans

dev-scale:
	docker compose -f ./docker/docker-compose.dev.yml up --build -V  --scale immich-server=3 --remove-orphans

.PHONY: e2e
e2e:
	docker compose -f ./e2e/docker-compose.yml up --build -V --remove-orphans

prod:
	docker compose -f ./docker/docker-compose.prod.yml up --build -V --remove-orphans

prod-scale:
	docker compose -f ./docker/docker-compose.prod.yml up --build -V --scale immich-server=3 --scale immich-microservices=3 --remove-orphans

.PHONY: open-api
open-api:
	cd ./open-api && bash ./bin/generate-open-api.sh

open-api-dart:
	cd ./open-api && bash ./bin/generate-open-api.sh dart

open-api-typescript:
	cd ./open-api && bash ./bin/generate-open-api.sh typescript

sql:
	npm --prefix server run sync:sql

attach-server:
	docker exec -it docker_immich-server_1 sh

renovate:
  LOG_LEVEL=debug npx renovate --platform=local --repository-cache=reset

MODULES = e2e server web cli sdk

audit-%:
	npm --prefix $(subst sdk,open-api/typescript-sdk,$*) audit fix
install-%:
	npm --prefix $(subst sdk,open-api/typescript-sdk,$*) i
build-cli: build-sdk
build-web: build-sdk
build-%: install-%
	npm --prefix $(subst sdk,open-api/typescript-sdk,$*) run | grep 'build' >/dev/null \
		&& npm --prefix $(subst sdk,open-api/typescript-sdk,$*) run build || true
format-%:
	npm --prefix $(subst sdk,open-api/typescript-sdk,$*) run | grep 'format:fix' >/dev/null \
		&& npm --prefix $(subst sdk,open-api/typescript-sdk,$*) run format:fix || true
lint-%:
	npm --prefix $* run lint:fix
check-%:
	npm --prefix $* run check
check-web:
	npm --prefix web run check:typescript
	npm --prefix web run check:svelte
test-%:
	npm --prefix $* run test
test-e2e:
	docker compose -f ./e2e/docker-compose.yml build
	npm --prefix e2e run test
	npm --prefix e2e run test:web
test-medium:
	docker run \
    --rm \
    -v ./server/src:/usr/src/app/src \
    -v ./server/test:/usr/src/app/test \
    -v ./server/vitest.config.medium.mjs:/usr/src/app/vitest.config.medium.mjs \
    -v ./server/tsconfig.json:/usr/src/app/tsconfig.json \
    -e NODE_ENV=development \
    immich-server:latest \
    -c "npm ci && npm run test:medium -- --run"
test-medium-dev:
	docker exec -it immich_server /bin/sh -c "npm run test:medium"

build-all: $(foreach M,$(MODULES),build-$M) ;
install-all: $(foreach M,$(MODULES),install-$M) ;
check-all: $(foreach M,$(MODULES),check-$M) ;
lint-all: $(foreach M,$(MODULES),lint-$M) ;
format-all: $(foreach M,$(MODULES),format-$M) ;
audit-all:  $(foreach M,$(MODULES),audit-$M) ;
hygiene-all: lint-all format-all check-all sql audit-all;
test-all: $(foreach M,$(MODULES),test-$M) ;

clean:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +
	find . -name "svelte-kit" -type d -prune -exec rm -rf '{}' +
	docker compose -f ./docker/docker-compose.dev.yml rm -v -f || true
	docker compose -f ./e2e/docker-compose.yml rm -v -f || true
