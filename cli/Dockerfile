FROM node:20-alpine3.19@sha256:ef3f47741e161900ddd07addcaca7e76534a9205e4cd73b2ed091ba339004a75 as core

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