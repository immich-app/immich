dev:
	rm -rf ./server/dist && docker-compose -f ./docker/docker-compose.dev.yml up --remove-orphans

dev-new:
	rm -rf ./server/dist && docker compose -f ./docker/docker-compose.dev.yml up --remove-orphans

dev-update:
	rm -rf ./server/dist && docker-compose -f ./docker/docker-compose.dev.yml up --build -V --remove-orphans

dev-scale:
	rm -rf ./server/dist && docker-compose -f ./docker/docker-compose.dev.yml up --build -V  --scale immich-server=3 --remove-orphans

stage:
	docker-compose -f ./docker/docker-compose.staging.yml up --build -V --remove-orphans

pull-stage:
	docker-compose -f ./docker/docker-compose.staging.yml pull

test-e2e:
	docker-compose -f ./docker/docker-compose.test.yml --env-file ./docker/.env.test -p immich-test-e2e up  --renew-anon-volumes --abort-on-container-exit --exit-code-from immich-server-test --remove-orphans --build

prod:
	docker-compose -f ./docker/docker-compose.yml up --build -V --remove-orphans

prod-scale:
	docker-compose -f ./docker/docker-compose.yml up --build -V --scale immich-server=3 --scale immich-microservices=3 --remove-orphans

api:
	cd ./server && npm run api:generate
