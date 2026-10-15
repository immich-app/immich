FROM rust:1.98.0-trixie@sha256:620dbcd124499c59e2406d3741574b5c5838cf9eb9656f0c3a03948f79b02959 AS sidecar-renderer

ARG TARGETPLATFORM
ARG CARGO_BUILD_JOBS=2

RUN apt-get update && \
  apt-get install -y --no-install-recommends libraw-dev pkg-config && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/sidecar-renderer
COPY ./server/native/sidecar-renderer ./
RUN --mount=type=cache,id=sidecar-cargo-registry,target=/usr/local/cargo/registry \
  --mount=type=cache,id=sidecar-cargo-git,target=/usr/local/cargo/git \
  --mount=type=cache,id=sidecar-cargo-target-${TARGETPLATFORM},target=/usr/src/sidecar-renderer/target \
  cargo build --release --locked && \
  install -Dm755 target/release/immich-sidecar-renderer /output/immich-sidecar-renderer

FROM ghcr.io/immich-app/base-server-dev:202610131110@sha256:082dc5e2611953d63d7b30dc8427da37ff5cd1d932aa9e99ccc4a26298b5f7a5 AS builder
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp \
  PNPM_HOME=/buildcache/pnpm-store \
  PATH="/buildcache/pnpm-store:$PATH"

RUN npm install --global corepack@latest && \
  corepack enable pnpm && \
  pnpm config set store-dir "$PNPM_HOME"

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./

FROM builder AS sdk

COPY ./packages/sdk/package.json ./packages/sdk/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/sdk install --frozen-lockfile

COPY ./packages/sdk ./packages/sdk/
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/sdk build

FROM sdk AS plugin-sdk

COPY ./packages/plugin-sdk/package.json ./packages/plugin-sdk/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/plugin-sdk install --frozen-lockfile

COPY ./packages/plugin-sdk ./packages/plugin-sdk/
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/plugin-sdk build

FROM plugin-sdk AS server

COPY ./server/package.json ./server/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter immich install --frozen-lockfile

COPY ./server ./server/
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store \
  pnpm --filter immich build && \
  pnpm --filter immich --prod --no-optional deploy /output/server-pruned
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store \
  SHARP_FORCE_GLOBAL_LIBVIPS=true pnpm --config.verify-deps-before-run=false --dir /output/server-pruned/node_modules/sharp exec npm run build

FROM sdk AS web

COPY ./web/package.json ./web/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter immich-web install --frozen-lockfile

COPY ./i18n ./i18n/
COPY ./web ./web/

ARG BUILD_ID
ENV IMMICH_BUILD=${BUILD_ID}

RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter immich-web build

FROM sdk AS cli

COPY ./packages/cli/package.json ./packages/cli/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/cli install --frozen-lockfile

COPY ./packages/cli ./packages/cli/
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store \
  pnpm --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

FROM plugin-sdk AS plugins

ARG TARGETPLATFORM

COPY --from=ghcr.io/jdx/mise:2026.10.9@sha256:07fc362c08135a926cbb1466470d9af10e89c9aa92859831c0ded2f2249bae7d /usr/local/bin/mise /usr/local/bin/mise

COPY ./mise.toml ./mise.toml
COPY ./mise.lock ./mise.lock
COPY ./.mise ./.mise
COPY ./packages/plugin-core/mise.toml ./packages/plugin-core/
ENV MISE_TRUSTED_CONFIG_PATHS=/usr/src/app/mise.toml
ENV MISE_DATA_DIR=/buildcache/mise
ENV MISE_DISABLE_TOOLS=flutter
RUN --mount=type=cache,id=mise-tools-${TARGETPLATFORM},target=/buildcache/mise \
  mise install --locked

COPY ./packages/plugin-core ./packages/plugin-core/

# Build plugins
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store \
  --mount=type=cache,id=mise-tools-${TARGETPLATFORM},target=/buildcache/mise \
  mise //:plugins

FROM ghcr.io/immich-app/base-server-prod:202610131110@sha256:9d4ce4bfd72d77edddd3072fbca78b7f4307a32c8cbe75276349944dd6405be3

RUN apt-get update && \
  apt-get install -y --no-install-recommends libraw23t64 && \
  rm -rf /var/lib/apt/lists/*

COPY --from=sidecar-renderer /output/immich-sidecar-renderer /usr/local/bin/immich-sidecar-renderer

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server /output/server-pruned ./server
COPY --from=web /usr/src/app/web/build /build/www
COPY --from=cli /output/cli-pruned ./cli
COPY --from=plugins /usr/src/app/packages/plugin-core/dist /build/plugins/immich-plugin-core/dist
COPY --from=plugins /usr/src/app/packages/plugin-core/manifest.json /build/plugins/immich-plugin-core/manifest.json
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
