FROM ghcr.io/immich-app/base-server-dev:202610291416@sha256:5f4f9f77059e1cd0182994419a19f4ee045c3fd48e611f5e77623ed63f7aa1e4
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
