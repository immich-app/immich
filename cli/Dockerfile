FROM node:24.1.0-alpine3.20@sha256:8fe019e0d57dbdce5f5c27c0b63d2775cf34b00e3755a7dea969802d7e0c2b25 AS core

WORKDIR /usr/src/app
COPY package* pnpm* .pnpmfile.cjs ./
COPY ./cli ./cli/
COPY ./open-api/typescript-sdk ./open-api/typescript-sdk/
RUN corepack enable pnpm && \
  pnpm install --filter @immich/sdk --filter @immich/cli --frozen-lockfile && \
  pnpm --filter @immich/sdk build && \
  pnpm --filter @immich/cli build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/cli/dist"]
