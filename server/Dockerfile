# dev build
FROM ghcr.io/immich-app/base-server-dev:commit-a050847fdf07f1e492919810121419f65ec9eb45 AS dev

# This next line is temporary, until the docker images are tagged properly. Currently, the dev tag is the same as the prod tag.
RUN apt-get update && apt-get install --no-install-recommends -yqq tini make
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1

WORKDIR /usr/src/app
COPY ./server/package* ./server/
COPY Makefile ./package* ./pnpm* ./

RUN echo "umask 000" >> /etc/profile && \
  echo "umask 000" >> /etc/bash.bashrc && \
  chmod o+wx /usr/src/app && \
  chmod o+wx /usr/src/app/server && \
  umask 000 && mkdir -p /buildcache/pnpm-store && \
  corepack enable pnpm && \
  pnpm config set store-dir /buildcache/pnpm-store && \
  SHARP_IGNORE_GLOBAL_LIBVIPS=true make setup-server-dev

ENV PATH="${PATH}:/usr/src/app/bin" \
  IMMICH_ENV=development \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

ENTRYPOINT ["tini", "--", "/bin/sh"]

FROM dev AS dev-container-server

RUN apt-get update && \
  apt-get install sudo inetutils-ping openjdk-11-jre-headless \
  vim nano \
  -y --no-install-recommends --fix-missing

RUN usermod -aG sudo node
RUN echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
RUN mkdir -p /workspaces/immich
COPY --chmod=777 ../.devcontainer/server/*.sh /immich-devcontainer/

COPY .. /tmp/create-dep-cache/
WORKDIR /tmp/create-dep-cache
RUN make setup-server-dev setup-web-dev && rm -rf /tmp/create-dep-cache

FROM dev-container-server AS dev-container-mobile

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
ENV FLUTTER_VERSION="3.29.3"
ENV FLUTTER_HOME=/flutter
ENV PATH=${PATH}:${FLUTTER_HOME}/bin

# Flutter SDK
RUN mkdir -p ${FLUTTER_HOME} \
  && curl -C - --output flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/${FLUTTER_CHANNEL}/linux/flutter_linux_${FLUTTER_VERSION}-${FLUTTER_CHANNEL}.tar.xz \
  && tar -xf flutter.tar.xz --strip-components=1 -C ${FLUTTER_HOME} \
  && rm flutter.tar.xz \
  && chown -R node ${FLUTTER_HOME}

RUN sudo apt-get update \
  && wget -qO- https://dcm.dev/pgp-key.public | sudo gpg --dearmor -o /usr/share/keyrings/dcm.gpg \
  && echo 'deb [signed-by=/usr/share/keyrings/dcm.gpg arch=amd64] https://dcm.dev/debian stable main' | sudo tee /etc/apt/sources.list.d/dart_stable.list \
  && sudo apt-get update \
  && sudo apt-get install dcm -y

COPY --chmod=777 ../.devcontainer/mobile/container-mobile-post-create.sh /immich-devcontainer/container-mobile-post-create.sh

RUN dart --disable-analytics

# server production build
FROM dev AS server-prod

WORKDIR /usr/src/app
RUN pnpm --filter immich install --frozen-lockfile && \
  pnpm --filter immich build && \
  pnpm --filter immich --prod --no-optional deploy /output/server-pruned

# web production build
FROM dev AS web-prod

WORKDIR /usr/src/app
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./open-api/typescript-sdk ./open-api/typescript-sdk/
RUN pnpm install --filter @immich/sdk --filter immich-web --frozen-lockfile && \
  pnpm --filter @immich/sdk build && \
  pnpm --filter immich-web build

FROM dev AS cli-prod

COPY ./cli ./cli/
COPY ./open-api/typescript-sdk ./open-api/typescript-sdk/
RUN pnpm install --filter @immich/sdk --filter @immich/cli --frozen-lockfile && \
  pnpm --filter @immich/sdk build && \
  pnpm --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

# prod build
FROM ghcr.io/immich-app/base-server-prod:commit-a050847fdf07f1e492919810121419f65ec9eb45

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server-prod /output/server-pruned/dist ./dist
COPY --from=server-prod /output/server-pruned/bin ./bin
COPY --from=server-prod /output/server-pruned/package.json ./
COPY --from=server-prod /output/server-pruned/node_modules/ ./node_modules
COPY --from=web-prod /usr/src/app/web/build /build/www
COPY --from=cli-prod /output/cli-pruned ./cli
RUN ln -S ./cli/bin/immich /usr/src/app/bin/immich
COPY server/resources ./resources/
COPY server/start*.sh docker/scripts/get-cpus.sh ./
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

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

VOLUME /usr/src/app/upload
EXPOSE 2283
ENTRYPOINT ["tini", "--", "/bin/bash"]
CMD ["start.sh"]

HEALTHCHECK CMD immich-healthcheck
