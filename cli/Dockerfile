FROM node:22.13.0-alpine3.20@sha256:db8dcb90326a0116375414e9a7c068a6b87a4422b7da37b5c6cd026f7c7835d3 AS core

WORKDIR /usr/src/open-api/typescript-sdk
COPY open-api/typescript-sdk/package*.json open-api/typescript-sdk/tsconfig*.json ./
RUN npm ci
COPY open-api/typescript-sdk/ ./
RUN npm run build

WORKDIR /usr/src/app

COPY cli/package.json cli/package-lock.json ./
RUN npm ci

COPY cli .
RUN npm run build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/dist"]
