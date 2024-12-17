FROM node:22.12.0-alpine3.20@sha256:96cc8323e25c8cc6ddcb8b965e135cfd57846e8003ec0d7bcec16c5fd5f6d39f AS core

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
