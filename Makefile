dev:
	docker-compose -f ./docker/docker-compose.yml up

dev-update:
	docker-compose -f ./docker/docker-compose.yml up --build -V 

dev-scale:
	docker-compose -f ./docker/docker-compose.yml up --build -V  --scale immich_server=3 --remove-orphans 
