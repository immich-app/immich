dev:
	docker-compose -f ./server/docker-compose.yml up

update:
	docker-compose -f ./server/docker-compose.yml up --build -V