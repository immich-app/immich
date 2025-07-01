# dev build
# Note: can't use prod images to build web/server: sharp binding won't build since pkg-config missing
FROM ghcr.io/midzelis/base-images/base-server-dev:latest AS dev

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
COPY --chown=node:node . .
RUN pnpm fetch

ENTRYPOINT ["tini", "--", "/bin/sh"]

FROM dev AS dev-docker

WORKDIR /usr/src/app
RUN make setup-dev

FROM dev-docker AS dev-container-server

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

WORKDIR /workspaces/immich

FROM dev-container-server AS dev-container-mobile
# USER root
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

WORKDIR /usr/src/app/server
RUN pnpm install --frozen-lockfile && \
    pnpm build 

WORKDIR /usr/src/app/open-api/typescript-sdk
RUN pnpm install --frozen-lockfile && \
    pnpm build

WORKDIR /usr/src/app/cli
RUN pnpm install --frozen-lockfile && \
    pnpm build

WORKDIR /usr/src/app/web
RUN pnpm install --frozen-lockfile && \
    pnpm build 

WORKDIR /usr/src/app/
RUN pnpm --filter @immich/cli --prod --no-optional deploy cli-pruned && \
    pnpm --filter immich --prod --no-optional deploy server-pruned 

RUN pnpm store prune

# prod build
FROM ghcr.io/midzelis/base-images/base-server-prod:latest 

RUN corepack enable && \
    corepack install -g pnpm 

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    NVIDIA_DRIVER_CAPABILITIES=all \
    NVIDIA_VISIBLE_DEVICES=all \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN mkdir -p /usr/local/etc && \
    mkdir -p /usr/src/app/upload && \
    chown -R node:node /usr/src/app && \
    chmod 755 /usr/src/app

COPY --from=prod /usr/src/app/server-pruned ./ 
COPY --from=prod /usr/src/app/web/build /build/www
COPY --from=prod /usr/src/app/cli/dist ./cli
COPY docker/scripts/get-cpus.sh \
    pnpm-workspace.yaml \
    pnpm-lock.yaml ./
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

RUN echo '#!/usr/bin/env node' > /usr/src/app/bin/immich && \
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