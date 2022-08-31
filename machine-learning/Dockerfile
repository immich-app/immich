# Build stage
FROM node:16-bullseye-slim as builder

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apt-get update
RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

RUN npm ci
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

COPY . .

RUN npm run build


# Prod stage
FROM node:16-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY entrypoint.sh ./

RUN mkdir -p /usr/src/app/dist \
  && mkdir -p /usr/src/app/node_modules \
  && apt-get update \
  && apt-get install -y ffmpeg \
  && rm -rf /var/cache/apt/lists

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

RUN npm prune --production

# CMD [ "node", "dist/main" ]
