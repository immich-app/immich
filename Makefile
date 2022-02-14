dev:
	docker-compose -f ./server/docker-compose.yml up

dev-update:
	docker-compose -f ./server/docker-compose.yml up --build -V 

dev-scale:
	docker-compose -f ./server/docker-compose.yml up --build -V  --scale immich_server=3 --remove-orphans 
