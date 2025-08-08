FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e

ENV CHOKIDAR_USEPOLLING=true \
  PATH="${PATH}:/usr/src/app/web/bin" \
  COREPACK_HOME=/tmp

RUN npm install --global corepack@latest && \
  corepack enable && corepack install -g pnpm && \
  apk add --no-cache tini make bash && \
  mkdir -p /buildcache/pnpm-store && \
  pnpm config set store-dir /buildcache/pnpm-store

WORKDIR /usr/src/app/web

EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
