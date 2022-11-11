
FROM node:16-bullseye-slim as builder

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

COPY package.json package-lock.json ./

RUN npm ci
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

COPY . .


FROM builder as prod

RUN npm run build

RUN npm prune --omit=dev


FROM node:16-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get install -y ffmpeg \
  && rm -rf /var/cache/apt/lists

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist

COPY package.json package-lock.json ./
COPY entrypoint.sh ./

# CMD [ "node", "dist/main" ]
