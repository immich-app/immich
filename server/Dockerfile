# Build stage
FROM node:16-alpine3.14 as builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apk add --update-cache build-base python3 libheif vips-dev \
    && npm ci

COPY . .

RUN npm run build


# Prod stage
FROM node:16-alpine3.14

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

RUN mkdir -p /usr/src/app/dist \
    && apk add --no-cache --virtual build-dependencies build-base python3 vips-dev \
    && apk add --no-cache libheif vips ffmpeg \
    && npm install --production \
    && apk del build-dependencies

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001
