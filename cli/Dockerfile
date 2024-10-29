FROM node:20.18.0-alpine3.20@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS core

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
