FROM node:18-alpine3.17 as builder

WORKDIR /usr/src/app

RUN apk add --update-cache build-base python3 vips-heif vips-dev ffmpeg perl

COPY package.json package-lock.json ./

RUN npm ci

COPY . .


FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional


FROM node:18-alpine3.17

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache vips-heif vips vips-cpp ffmpeg perl

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

RUN npm link && npm cache clean --force

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["/bin/sh"]
