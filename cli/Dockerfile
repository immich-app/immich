FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS core

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
