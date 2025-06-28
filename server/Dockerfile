# dev build
FROM ghcr.io/immich-app/base-server-dev:202505131114@sha256:cf4507bbbf307e9b6d8ee9418993321f2b85867da8ce14d0a20ccaf9574cb995 AS dev

ENV PATH="${PATH}:/usr/src/app/bin" \
    IMMICH_ENV=development \
    NVIDIA_DRIVER_CAPABILITIES=all \
    NVIDIA_VISIBLE_DEVICES=all \
    COREPACK_ENABLE_AUTO_PIN=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    npm_config_devdir=/buildcache/node_gyp
    
RUN corepack enable && \
    corepack install -g pnpm && \
    apt-get install --no-install-recommends -yqq tini

RUN mkdir -p /buildcache/pnpm_store && \
    chown -R node:node /buildcache && \
    mkdir -p /usr/local/etc && \
    echo "store-dir=/buildcache/pnpm_store" >> /usr/local/etc/npmrc 

RUN rm -rf /usr/src/app && \
    mkdir -p /usr/src/app && \
    chown node:node /usr/src/app 

USER node

WORKDIR /usr/src/app
COPY --chown=node:node \
    server/package.json \
    server/pnpm-lock.yaml \
    pnpm-workspace.yaml \
    ./
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm fetch

ENTRYPOINT ["tini", "--", "/bin/sh"]

FROM dev AS dev-docker

WORKDIR /usr/src/app
VOLUME /usr/src/app/node_modules
# Run this without build-cache, so these are cached in image itself
# This will also build node-gyp binaries, like sharp/canvas
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --offline

FROM dev AS dev-container-server

USER root
# Remove app dir from dev container
RUN rm -rf /usr/src/app

RUN apt-get update && \
    apt-get install sudo inetutils-ping openjdk-11-jre-headless \
    vim nano -y --no-install-recommends --fix-missing

RUN usermod -aG sudo node && \
    echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER node

RUN sudo mkdir -p /workspaces/immich && \
    sudo chown node -R /workspaces && \
    sudo mkdir /immich-devcontainer && \
    sudo chown node -R /immich-devcontainer

COPY --chmod=777 \
    ../.devcontainer/server/*.sh \
    /immich-devcontainer/

WORKDIR /tmp/build
COPY --chown=node:node \
    package.json \
    pnpm-lock.yaml \
    ./
# note: e2e is part of dockerignore, so it is not copied here
COPY --chown=node:node \
    web/package.json \
    web/pnpm-lock.yaml \
    ./web/
COPY --chown=node:node \
    cli/package.json \
    cli/pnpm-lock.yaml \
    ./cli/
COPY --chown=node:node \
    server/package.json \
    server/pnpm-lock.yaml \
    ./server/
# note: docs is part of dockerignore, so it is not copied here
COPY --chown=node:node open-api/typescript-sdk/package.json \
    open-api/typescript-sdk/pnpm-lock.yaml \
    ./open-api/typescript-sdk/

# This will cache all dependencies
RUN pnpm store prune && pnpm fetch 
WORKDIR /workspaces/immich
RUN rm -rf /tmp/build

FROM dev-container-server AS dev-container-mobile
USER root
# Enable multiarch for arm64 if necessary
RUN if [ "$(dpkg --print-architecture)" = "arm64" ]; then \
    sudo dpkg --add-architecture amd64 && \
    sudo apt-get install -y --no-install-recommends \
        qemu-user-static \
        libc6:amd64 \
        libstdc++6:amd64 \
        libgcc1:amd64; \
    fi

# Flutter SDK
# https://flutter.dev/docs/development/tools/sdk/releases?tab=linux
ENV FLUTTER_CHANNEL="stable"
ENV FLUTTER_VERSION="3.29.3"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

# Flutter SDK
RUN sudo mkdir -p ${FLUTTER_HOME} \
  && sudo curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && sudo tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && sudo rm flutter.tar.xz \
  && sudo chown -R node ${FLUTTER_HOME}

RUN wget -qO- https://dcm.dev/pgp-key.public | sudo gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | sudo tee /etc/apt/sources.list.d/dart_stable.list \
  && sudo apt-get update \
  && sudo apt-get install dcm -y

COPY --chmod=777 ../.devcontainer/mobile/container-mobile-post-create.sh /immich-devcontainer/container-mobile-post-create.sh

RUN dart --disable-analytics

# server production build
FROM dev AS prod

USER root
RUN chown node:node /usr/src/app
USER node
COPY --chown=node:node server .
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --offline && \
    pnpm build

FROM dev AS sdk

COPY --chown=node:node open-api/typescript-sdk/ .
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --no-optional && \
    pnpm build 

# web production build
FROM dev AS web

COPY --chown=node:node web .
COPY --from=sdk /usr/src/app /usr/src/open-api/typescript-sdk
COPY --chown=node:node i18n /usr/src/i18n
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm build 

FROM dev AS cli

COPY --chown=node:node cli .
COPY --from=sdk /usr/src/app /usr/src/open-api/typescript-sdk
# the following command does not use --offline, because the cache created in 
# the 'dev' stage did not includ the cli depenencies
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile && \
    pnpm build 

# prod build
FROM ghcr.io/immich-app/base-server-prod:202505061115@sha256:9971d3a089787f0bd01f4682141d3665bcf5efb3e101a88e394ffd25bee4eedb

RUN corepack enable && \
    corepack install -g pnpm 

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    NVIDIA_DRIVER_CAPABILITIES=all \
    NVIDIA_VISIBLE_DEVICES=all \
    npm_config_devdir=/buildcache/node_gyp \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN mkdir -p /buildcache/pnpm_store && \
    chown -R node:node /buildcache && \
    mkdir -p /usr/local/etc && \
    echo "store-dir=/buildcache/pnpm_store" >> /usr/local/etc/npmrc && \
    mkdir -p /usr/src/app/upload && \
    chown -R node:node /usr/src/app && \
    chmod 755 /usr/src/app

COPY --chown=node:node --from=prod /usr/src/app/dist ./dist 
COPY --chown=node:node --from=prod /usr/src/app/bin ./bin
COPY --chown=node:node --from=web /usr/src/app/build /build/www
COPY --chown=node:node --from=cli /usr/src/app/dist ./cli
COPY --chown=node:node server/resources ./resources/
COPY --chown=node:node server/package.json server/pnpm-lock.yaml pnpm-workspace.yaml server/start*.sh \
                       docker/scripts/get-cpus.sh ./
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

USER node
RUN --mount=type=cache,id=pnpm,target=/buildcache,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --offline --prod --no-optional && \
    echo '#!/usr/bin/env node' > /usr/src/app/bin/immich && \
    echo 'require("../cli/index.js");' >> /usr/src/app/bin/immich && \
    chmod +x /usr/src/app/bin/immich 

ENV PATH="${PATH}:/usr/src/app/bin"

ARG BUILD_ID
ARG BUILD_IMAGE
ARG BUILD_SOURCE_REF
ARG BUILD_SOURCE_COMMIT

ENV IMMICH_BUILD=${BUILD_ID}
ENV IMMICH_BUILD_URL=https://github.com/immich-app/immich/actions/runs/${BUILD_ID}
ENV IMMICH_BUILD_IMAGE=${BUILD_IMAGE}
ENV IMMICH_BUILD_IMAGE_URL=https://github.com/immich-app/immich/pkgs/container/immich-server
ENV IMMICH_REPOSITORY=immich-app/immich
ENV IMMICH_REPOSITORY_URL=https://github.com/immich-app/immich
ENV IMMICH_SOURCE_REF=${BUILD_SOURCE_REF}
ENV IMMICH_SOURCE_COMMIT=${BUILD_SOURCE_COMMIT}
ENV IMMICH_SOURCE_URL=https://github.com/immich-app/immich/commit/${BUILD_SOURCE_COMMIT}

USER root

VOLUME /usr/src/app/upload
EXPOSE 2283
ENTRYPOINT ["tini", "--", "/bin/bash"]
CMD ["start.sh"]

HEALTHCHECK CMD immich-healthcheck
