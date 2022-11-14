FROM node:16-alpine3.14 as builder

WORKDIR /usr/src/app

RUN apk add --update-cache build-base python3 libheif vips-dev ffmpeg

COPY package.json package-lock.json ./

RUN npm ci

COPY . .


FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev


FROM node:16-alpine3.14

WORKDIR /usr/src/app

RUN apk add --no-cache libheif vips ffmpeg

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

VOLUME /usr/src/app/upload

EXPOSE 3001
