FROM node:24.19.0-trixie-slim@sha256:0711b541c1c33a8a530ac4f0d391baa9a15b3d804695b1b24a47daa5fb60e74d AS core

WORKDIR /usr/src/app
COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages ./packages/
RUN corepack enable pnpm && \
  pnpm --filter @immich/sdk --filter @immich/cli install --frozen-lockfile && \
  pnpm --filter @immich/sdk --filter @immich/cli build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/packages/cli/dist"]
