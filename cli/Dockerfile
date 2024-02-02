FROM node:20-alpine3.18 as core

WORKDIR /usr/src/open-api/typescript-sdk
COPY open-api/typescript-sdk/package*.json open-api/typescript-sdk/tsconfig*.json ./
RUN npm ci
COPY open-api/typescript-sdk/ ./
RUN npm run build

WORKDIR /usr/src/app

COPY cli/ .
RUN npm ci
RUN npm run build
RUN npm install -g .

WORKDIR /import
ENTRYPOINT [ "immich" ]