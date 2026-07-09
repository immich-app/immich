FROM ghcr.io/immich-app/base-server-dev:202607061334@sha256:c83ef9c6d7f5e7f6a276fe96647484d46b7bf6cacc1e35b823dd1d7a1aeda3b8 AS builder
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
COPY ./packages/sdk ./packages/sdk/
COPY ./packages/plugin-sdk ./packages/plugin-sdk/
RUN --mount=type=cache,id=pnpm-server,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter @immich/sdk --filter @immich/plugin-sdk --filter immich build && \
  SHARP_FORCE_GLOBAL_LIBVIPS=true  pnpm --filter immich --prod --no-optional deploy /output/server-pruned

FROM builder AS web

ARG BUILD_ID
ENV IMMICH_BUILD=${BUILD_ID}

WORKDIR /usr/src/app
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./packages ./packages/
RUN --mount=type=cache,id=pnpm-web,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter @immich/sdk --filter immich-web install --frozen-lockfile --force && \
  pnpm --filter @immich/sdk --filter immich-web build

FROM builder AS cli

COPY ./packages ./packages/
RUN --mount=type=cache,id=pnpm-cli,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  pnpm --filter @immich/sdk --filter @immich/cli install --frozen-lockfile && \
  pnpm --filter @immich/sdk --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

FROM builder AS plugins

ARG TARGETPLATFORM

COPY --from=ghcr.io/jdx/mise:2026.7.2@sha256:51d92371cc08e3c4f0e52f58bb3ec1975a6dc966b7430a4da37dcfc6ae772f30 /usr/local/bin/mise /usr/local/bin/mise

WORKDIR /app
COPY ./mise.toml ./mise.toml
COPY ./packages/plugin-core/mise.toml ./packages/plugin-core/
ENV MISE_TRUSTED_CONFIG_PATHS=/app/mise.toml
ENV MISE_DATA_DIR=/buildcache/mise
ENV MISE_DISABLE_TOOLS=flutter
RUN --mount=type=cache,id=mise-tools-${TARGETPLATFORM},target=/buildcache/mise \
  mise install

COPY ./packages/sdk ./packages/sdk/
COPY ./packages/plugin-core ./packages/plugin-core/
COPY ./packages/plugin-sdk ./packages/plugin-sdk/

# Build plugins
RUN --mount=type=cache,id=pnpm-packages,target=/buildcache/pnpm-store \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=.pnpmfile.cjs,target=.pnpmfile.cjs \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
  --mount=type=cache,id=mise-tools-${TARGETPLATFORM},target=/buildcache/mise \
  mise //:plugins

FROM ghcr.io/immich-app/base-server-prod:202607061334@sha256:c07ef6510ff2ccb6ead28434ade7c7a0c08aef33d7d3466b14beccdd431e86f7

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server /output/server-pruned ./server
COPY --from=web /usr/src/app/web/build /build/www
COPY --from=cli /output/cli-pruned ./cli
COPY --from=plugins /app/packages/plugin-core/dist /build/plugins/immich-plugin-core/dist
COPY --from=plugins /app/packages/plugin-core/manifest.json /build/plugins/immich-plugin-core/manifest.json
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
