dev:
	docker compose -f ./docker/docker-compose.dev.yml up --remove-orphans || make dev-down

dev-down:
	docker compose -f ./docker/docker-compose.dev.yml down --remove-orphans

dev-update:
	docker compose -f ./docker/docker-compose.dev.yml up --build -V --remove-orphans

dev-scale:
	docker compose -f ./docker/docker-compose.dev.yml up --build -V  --scale immich-server=3 --remove-orphans

stage:
	docker compose -f ./docker/docker-compose.staging.yml up --build -V --remove-orphans

pull-stage:
	docker compose -f ./docker/docker-compose.staging.yml pull

server-e2e-jobs:
	docker compose -f ./server/e2e/docker-compose.server-e2e.yml up --renew-anon-volumes --abort-on-container-exit --exit-code-from immich-server --remove-orphans --build

server-e2e-api:
	npm run e2e:api --prefix server

.PHONY: e2e
e2e:
	docker compose -f ./docker/docker-compose.e2e.yml up --build -V --remove-orphans

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
	npm --prefix server run sql:generate

attach-server:
	docker exec -it docker_immich-server_1 sh
