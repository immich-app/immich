FROM node:16-alpine3.14 as core

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apk add --update-cache build-base python3 libheif vips-dev vips ffmpeg

RUN npm ci

COPY . .

RUN npm run build
