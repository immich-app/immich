FROM node:20-alpine3.19@sha256:7a91aa397f2e2dfbfcdad2e2d72599f374e0b0172be1d86eeb73f1d33f36a4b2 as core

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