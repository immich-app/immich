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

test-e2e:
	docker compose -f ./docker/docker-compose.test.yml up --renew-anon-volumes --abort-on-container-exit --exit-code-from immich-server --remove-orphans --build

prod:
	docker compose -f ./docker/docker-compose.prod.yml up --build -V --remove-orphans

prod-scale:
	docker compose -f ./docker/docker-compose.prod.yml up --build -V --scale immich-server=3 --scale immich-microservices=3 --remove-orphans

api:
	cd ./server && npm run api:generate

attach-server:
	docker exec -it docker_immich-server_1 sh
