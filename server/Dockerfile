FROM ghcr.io/immich-app/base-server-dev:202509091104@sha256:4f9275330f1e49e7ce9840758ea91839052fe6ed40972d5bb97a9af857fa956a AS builder
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp

RUN npm install --global corepack@latest && \
  corepack enable pnpm

FROM builder AS server

WORKDIR /usr/src/app
COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./server ./server/
RUN SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter immich --frozen-lockfile build && \
  SHARP_FORCE_GLOBAL_LIBVIPS=true pnpm --filter immich --frozen-lockfile --prod --no-optional deploy /output/server-pruned

FROM builder AS web

WORKDIR /usr/src/app
COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./web ./web/
COPY ./i18n ./i18n/
COPY ./open-api ./open-api/
RUN SHARP_IGNORE_GLOBAL_LIBVIPS=true pnpm --filter @immich/sdk --filter immich-web --frozen-lockfile --force install && \
  pnpm --filter @immich/sdk --filter immich-web build

FROM builder AS cli

COPY ./package* ./pnpm* .pnpmfile.cjs ./
COPY ./cli ./cli/
COPY ./open-api ./open-api/
RUN pnpm --filter @immich/sdk --filter @immich/cli --frozen-lockfile install && \
  pnpm --filter @immich/sdk --filter @immich/cli build && \
  pnpm --filter @immich/cli --prod --no-optional deploy /output/cli-pruned

FROM ghcr.io/immich-app/base-server-prod:202509091104@sha256:d1ccbac24c84f2f8277cf85281edfca62d85d7daed6a62b8efd3a81bcd3c5e0e

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=server /output/server-pruned ./server
COPY --from=web /usr/src/app/web/build /build/www
COPY --from=cli /output/cli-pruned ./cli
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
