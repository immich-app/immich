FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS core

ENV COREPACK_ENABLE_AUTO_PIN=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 

RUN corepack enable && \
    corepack install -g pnpm 

WORKDIR /usr/src/app
COPY --chown=node:node . .

WORKDIR /usr/src/app/web
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm exec svelte-kit sync

WORKDIR /usr/src/app/open-api/typescript-sdk
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm build

WORKDIR /usr/src/app/cli
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --prod --no-optional && \
    pnpm build

RUN rm -rf /usr/src/app/web && \
    rm -rf /usr/src/app/open-api && \
    rm -rf /usr/src/app/cli/src && \
    rm -rf /usr/src/app/cli/src && \
    rm -rf /usr/src/app/server && \
    rm -rf /usr/src/app/i18n && \
    rm -rf /usr/src/app/e2e && \
    rm -rf /usr/src/app/docs && \
    rm -rf /usr/src/app/readme_i18n && \
    rm -rf /usr/src/app/deployment && \
    rm -rf /usr/src/app/docker 

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/cli/dist"]
