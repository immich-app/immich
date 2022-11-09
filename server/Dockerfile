FROM node:16 as builder

WORKDIR /usr/src/app

RUN apk add --update-cache vips-dev

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --production

# Prod stage
FROM node:16-alpine3.14

WORKDIR /usr/src/app

RUN apk add --no-cache libheif vips ffmpeg

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/bin ./bin

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

VOLUME /usr/src/app/upload

EXPOSE 3001
