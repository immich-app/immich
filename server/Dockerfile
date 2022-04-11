FROM node:16-alpine3.14

ARG DEBIAN_FRONTEND=noninteractive
ENV DB_HOST = immich_postgres 
ENV REDIS_HOST = immich_redis
ENV MICROSERVICE_HOST = immich_microservices

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apk add --update-cache build-base python3 

RUN npm install

COPY . .

RUN npm run build