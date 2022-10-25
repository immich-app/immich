# Build stage
FROM node:16-bullseye-slim as builder

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN   apt-get update > /dev/null \
  &&  apt-get install --no-install-recommends -y gcc g++ make cmake python3 python3-pip ffmpeg > /dev/null \
  &&  apt-get clean && rm -rf /var/lib/apt/lists/*

RUN npm ci
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

COPY . .

RUN npm run build


# Prod stage
FROM node:16-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY entrypoint.sh ./

RUN mkdir -p /usr/src/app/dist \
  && mkdir -p /usr/src/app/node_modules \
  && mkdir -p /usr/src/app/.reverse-geocoding-dump \
  && apt-get update > /dev/null \
  && apt-get install --no-install-recommends -y ffmpeg > /dev/null \
  && apt-get clean \
  && rm -rf /var/cache/apt/lists/*

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

RUN npm prune --production

RUN   chown -R node:0 /usr/src/app \
  &&  chmod -R g=u /usr/src/app

RUN addgroup node root