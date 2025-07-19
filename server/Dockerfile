# dev build
FROM ghcr.io/immich-app/base-server-dev:202507162011@sha256:85d4230c2208646bd6c528db41b2213d780b11b7a311397ca6a2aaba7cf697c8 AS dev

ARG SERVER_USER=0
ARG SERVER_GROUP=${SERVER_USER}

RUN chown -R ${SERVER_USER}:${SERVER_GROUP} /usr/src/app
USER ${SERVER_USER}:${SERVER_GROUP}

WORKDIR /usr/src/app
COPY --chown=${SERVER_USER}:${SERVER_GROUP} ./server/package* ./server/
WORKDIR /usr/src/app/server

RUN mkdir -p /usr/src/app/upload && \
  npm ci && \
  # exiftool-vendored.pl, sharp-linux-x64 and sharp-linux-arm64 are the only ones we need
  # they're marked as optional dependencies, so we need to copy them manually after pruning
  rm -rf node_modules/@img/sharp-libvips* && \
  rm -rf node_modules/@img/sharp-linuxmusl-x64
ENV PATH="${PATH}:/usr/src/app/server/bin" \
  IMMICH_ENV=development \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]

FROM dev AS dev-container-server

USER 0:0
RUN rm -rf /usr/src/app && \
  apt-get update && \
  apt-get install inetutils-ping openjdk-11-jre-headless \
  vim nano \
  -y --no-install-recommends --fix-missing

RUN mkdir -p /workspaces/immich/server/node_modules && \
  mkdir -p /workspaces/immich/web/node_modules && \
  mkdir -p /workspaces/immich/open-api/typescript-sdk/node_modules && \
  chown -R ${SERVER_USER}:${SERVER_GROUP} /workspaces/immich

USER $SERVER_USER:$SERVER_GROUP
COPY --chmod=555 --chown=${SERVER_USER}:${SERVER_GROUP} ../.devcontainer/server/*.sh /immich-devcontainer/

COPY --chown=${SERVER_USER}:${SERVER_GROUP} .. /tmp/create-dep-cache/
WORKDIR /tmp/create-dep-cache
RUN make ci-all && rm -rf /tmp/create-dep-cache

FROM dev-container-server AS dev-container-mobile
USER 0:0
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
ENV FLUTTER_VERSION="3.32.6"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

# Flutter SDK
RUN mkdir -p ${FLUTTER_HOME} \
  && curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && rm flutter.tar.xz \
  && chown -R ${SERVER_USER}:${SERVER_GROUP} ${FLUTTER_HOME}

RUN apt-get update \
  && wget -qO- https://dcm.dev/pgp-key.public | gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | tee /etc/apt/sources.list.d/dart_stable.list \
  && apt-get update \
  && apt-get install dcm -y

USER $SERVER_USER:$SERVER_GROUP
RUN dart --disable-analytics

FROM dev AS prod

USER 0:0
COPY server .
RUN npm run build
RUN npm prune --omit=dev --omit=optional
COPY --from=dev /usr/src/app/server/node_modules/@img ./node_modules/@img
COPY --from=dev /usr/src/app/server/node_modules/exiftool-vendored.pl ./node_modules/exiftool-vendored.pl

# web build
FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS web

USER 0:0
WORKDIR /usr/src/app
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./open-api/typescript-sdk ./open-api/typescript-sdk/

WORKDIR /usr/src/app/open-api/typescript-sdk
RUN npm ci && npm run build

WORKDIR /usr/src/app/web
RUN npm ci && npm run build

# prod build
FROM ghcr.io/immich-app/base-server-prod:202507162011@sha256:636f3ddb6106628ef851d51c23f3fa2c6e4829390cc315b27b38c288c82b23a7

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=prod /usr/src/app/server/node_modules ./server/node_modules
COPY --from=prod /usr/src/app/server/dist ./server/dist
COPY --from=prod /usr/src/app/server/bin ./server/bin
COPY --from=web /usr/src/app/web/build /build/www
COPY ./server/resources ./server/resources
COPY ./server/package.json server/package-lock.json ./
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

RUN npm install -g @immich/cli && npm cache clean --force
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

VOLUME /usr/src/app/upload
EXPOSE 2283
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
CMD ["start.sh"]

HEALTHCHECK CMD immich-healthcheck
