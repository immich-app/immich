FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS core

ENV COREPACK_ENABLE_AUTO_PIN=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 

RUN corepack enable && \
    corepack install -g pnpm 

WORKDIR /usr/src/open-api/typescript-sdk
COPY  pnpm-workspace.yaml open-api/typescript-sdk ./
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm build

WORKDIR /usr/src/app

COPY pnpm-workspace.yaml cli ./
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm build

WORKDIR /import

ENTRYPOINT ["node", "/usr/src/app/dist"]
