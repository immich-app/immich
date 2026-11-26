FROM ghcr.io/immich-app/base-server-dev:202611101105@sha256:174b605f52a3430c58295db1737d46a602cc076103aba60f33bdb8bb545e0b41
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp

RUN npm install --global corepack@latest && \
  corepack enable pnpm

WORKDIR /usr/src/app

COPY package* pnpm* .pnpmfile.cjs ./
COPY ./packages/e2e-auth-server/package.json ./packages/e2e-auth-server/

WORKDIR /usr/src/app/packages/e2e-auth-server
RUN pnpm install --frozen-lockfile

COPY ./packages/e2e-auth-server ./

EXPOSE 2286
CMD ["pnpm", "run", "start"]
