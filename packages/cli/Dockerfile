FROM node:24.22.1-trixie-slim@sha256:fdc9220097e0ae3bd947c44b10cd3af5867a67a6d3a23b30b30b70929219034e AS core

WORKDIR /usr/src/app
COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages ./packages/
RUN corepack enable pnpm && \
  pnpm --filter @immich/sdk --filter @immich/cli install --frozen-lockfile && \
  pnpm --filter @immich/sdk --filter @immich/cli build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/packages/cli/dist"]
