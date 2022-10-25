FROM node:16-alpine3.14 as builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apk add --update-cache build-base python3 libheif vips-dev ffmpeg
RUN npm ci

COPY . .

RUN npm run build

# Prod stage
FROM node:16-alpine3.14

WORKDIR /usr/src/app
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

RUN mkdir -p /usr/src/app/dist \
  && mkdir /usr/src/app/.reverse-geocoding-dump \
  && apk add --no-cache libheif vips ffmpeg

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

RUN npm prune --production

RUN   chown -R node:0 /usr/src/app \
  &&  chmod -R g=u /usr/src/app

RUN addgroup node root

VOLUME /usr/src/app/upload

EXPOSE 3001
