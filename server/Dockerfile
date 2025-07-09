# dev build
FROM ghcr.io/immich-app/base-server-dev:202507291116@sha256:e38543bdd77a02ed156cd9175ed11e9c16dccf48c418d46ecda48ce684de456a AS dev

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp

WORKDIR /usr/src/app

RUN npm install --global corepack@latest && \
  corepack enable pnpm && \
  pnpm config set store-dir /buildcache/pnpm-store

ENV PATH="${PATH}:/usr/src/app/server/bin" \
  IMMICH_ENV=development \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]

FROM dev AS dev-container-server

RUN apt-get update --allow-releaseinfo-change && \
  apt-get install sudo inetutils-ping openjdk-11-jre-headless \
  vim nano \
  -y --no-install-recommends --fix-missing

RUN usermod -aG sudo node && \
  echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
  mkdir -p /workspaces/immich

RUN chown node:node -R /workspaces
COPY --chown=node:node --chmod=755 ../.devcontainer/server/*.sh /immich-devcontainer/


COPY ./package* ./pnpm* .pnpmfile.cjs /tmp/create-dep-cache/
COPY ./web/package* ./web/pnpm* /tmp/create-dep-cache/web/
COPY ./server/package* ./server/pnpm* /tmp/create-dep-cache/server/
COPY ./open-api/typescript-sdk/package* ./open-api/typescript-sdk/pnpm* /tmp/create-dep-cache/open-api/typescript-sdk/
WORKDIR /tmp/create-dep-cache
RUN pnpm fetch && rm -rf /tmp/create-dep-cache
WORKDIR /workspaces/immich

FROM dev-container-server AS dev-container-mobile
USER root
# Enable multiarch for arm64 if necessary
RUN if [ "$(dpkg --print-architecture)" = "arm64" ]; then \
  dpkg --add-architecture amd64 && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
  qemu-user-static \
  libc6:amd64 \
  libstdc++6:amd64 \
  libgcc1:amd64; \
  fi

# Flutter SDK
# https://flutter.dev/docs/development/tools/sdk/releases?tab=linux
ENV FLUTTER_CHANNEL="stable"
ENV FLUTTER_VERSION="3.32.8"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

# Flutter SDK
RUN mkdir -p ${FLUTTER_HOME} \
  && curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && rm flutter.tar.xz \
  && chown -R node ${FLUTTER_HOME}

USER node
RUN sudo apt-get update \
  && wget -qO- https://dcm.dev/pgp-key.public | sudo gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | sudo tee /etc/apt/sources.list.d/dart_stable.list \
  && sudo apt-get update \
  && sudo apt-get install dcm -y

RUN dart --disable-analytics

# server production build
FROM dev AS server-prod

WORKDIR /usr/src/app
COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./server ./server/
RUN SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter immich --frozen-lockfile build && \
  pnpm --filter immich --frozen-lockfile --prod --no-optional deploy /output/server-pruned

# web production build
FROM dev AS web-prod

WORKDIR /usr/src/app
COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./open-api ./open-api/
RUN SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter @immich/sdk --filter immich-web --frozen-lockfile --force install && \
  pnpm --filter @immich/sdk --filter immich-web build

FROM dev AS cli-prod

COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./cli ./cli/
COPY ./open-api ./open-api/
RUN pnpm --filter @immich/sdk --filter @immich/cli --frozen-lockfile install && \
  pnpm --filter @immich/sdk --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

# prod build
FROM ghcr.io/immich-app/base-server-prod:202507291116@sha256:6e80f884c6e4f05cefe4b4fc4cc06a15bdb6ec9bd7b6e9eadf996a13b69494b6

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server-prod /output/server-pruned ./server
COPY --from=web-prod /usr/src/app/web/build /build/www
COPY --from=cli-prod /output/cli-pruned ./cli
RUN ln -s ./cli/bin/immich server/bin/immich
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

ENV PATH="${PATH}:/usr/src/app/server/bin"

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

VOLUME /data
EXPOSE 2283
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
CMD ["start.sh"]

HEALTHCHECK CMD immich-healthcheck
