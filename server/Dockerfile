FROM ghcr.io/immich-app/base-server-dev:202511261514@sha256:cbcca5851fd11042463f09797e6d6068d94adbb108749e62aa69159df59c0591 AS builder
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp \
  PNPM_HOME=/buildcache/pnpm-store \
  PATH="/buildcache/pnpm-store:$PATH"

RUN npm install --global corepack@latest && \
  corepack enable pnpm && \
  pnpm config set store-dir "$PNPM_HOME"

FROM builder AS server

WORKDIR /usr/src/app
COPY ./server ./server/
RUN --mount=type=cache,id=pnpm-server,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter immich --frozen-lockfile build && \
  SHARP_FORCE_GLOBAL_LIBVIPS=true pnpm --filter immich --frozen-lockfile --prod --no-optional deploy /output/server-pruned

FROM builder AS web

WORKDIR /usr/src/app
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./open-api ./open-api/
RUN --mount=type=cache,id=pnpm-web,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter @immich/sdk --filter immich-web --frozen-lockfile --force install && \
  pnpm --filter @immich/sdk --filter immich-web build

FROM builder AS cli

COPY ./cli ./cli/
COPY ./open-api ./open-api/
RUN --mount=type=cache,id=pnpm-cli,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  pnpm --filter @immich/sdk --filter @immich/cli --frozen-lockfile install && \
  pnpm --filter @immich/sdk --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

FROM builder AS plugins

COPY --from=ghcr.io/jdx/mise:2025.11.3@sha256:ac26f5978c0e2783f3e68e58ce75eddb83e41b89bf8747c503bac2aa9baf22c5 /usr/local/bin/mise /usr/local/bin/mise

WORKDIR /usr/src/app
COPY ./plugins/mise.toml ./plugins/
ENV MISE_TRUSTED_CONFIG_PATHS=/usr/src/app/plugins/mise.toml
ENV MISE_DATA_DIR=/buildcache/mise
RUN --mount=type=cache,id=mise-tools,target=/buildcache/mise \
  mise install --cd plugins

COPY ./plugins ./plugins/
# Build plugins
RUN --mount=type=cache,id=pnpm-plugins,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  --mount=type=cache,id=mise-tools,target=/buildcache/mise \
  cd plugins && mise run build

FROM ghcr.io/immich-app/base-server-prod:202511261514@sha256:c04c1c38dd90e53455b180aedf93c3c63474c8d20ffe2c6d7a3a61a2181e6d29

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server /output/server-pruned ./server
COPY --from=web /usr/src/app/web/build /build/www
COPY --from=cli /output/cli-pruned ./cli
COPY --from=plugins /usr/src/app/plugins/dist /build/corePlugin/dist
COPY --from=plugins /usr/src/app/plugins/manifest.json /build/corePlugin/manifest.json
RUN ln -s ../../cli/bin/immich server/bin/immich
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
