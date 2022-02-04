run_server_dev:
	docker-compose -f ./server/docker-compose.yml up

run_server_update:
	docker-compose -f ./server/docker-compose.yml up --build -V