dev:
	docker-compose -f ./server/docker-compose.yml up

dev-update:
	docker-compose -f ./server/docker-compose.yml up --build -V
