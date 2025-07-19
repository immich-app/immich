FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e

RUN corepack enable && corepack install -g pnpm && \
  apk add --no-cache tini make bash&& \
  echo "umask 000" | tee /etc/profile /etc/bash.bashrc >/dev/null && \
  umask 000 && mkdir -p /buildcache/pnpm-store && \
  pnpm config set store-dir /buildcache/pnpm-store && \
  mkdir -p /usr/src/app/node_modules && \
  mkdir -p /usr/src/app/web/node_modules && \
  mkdir -p /usr/src/app/web/.svelte-kit && \
  mkdir -p /usr/src/app/web/coverage && \
  mkdir -p /usr/src/app/.pnpm-store && \
  mkdir -p /usr/src/app/.github/node_modules && \
  mkdir -p /usr/src/app/docs/node_modules && \
  mkdir -p /usr/src/app/e2e/node_modules && \
  mkdir -p /usr/src/app/open-api/typescript-sdk/node_modules && \
  mkdir -p /usr/src/app/cli/node_modules

WORKDIR /usr/src/app/web

ENV CHOKIDAR_USEPOLLING=true \
  PATH="${PATH}:/usr/src/app/web/bin"
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
