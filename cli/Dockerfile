FROM node:20-alpine3.18 as core

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm install -g

WORKDIR /import
ENTRYPOINT [ "immich" ]