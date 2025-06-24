FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS core

WORKDIR /usr/src/open-api/typescript-sdk
COPY open-api/typescript-sdk/package*.json open-api/typescript-sdk/tsconfig*.json ./
RUN pnpm install --frozen-lockfile
COPY open-api/typescript-sdk/ ./
RUN pnpm build

WORKDIR /usr/src/app

COPY cli/package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY cli .
RUN pnpm build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/dist"]
