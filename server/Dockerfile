FROM ghcr.io/immich-app/base-server-dev:202509210934@sha256:b5ce2d7eaf379d4cf15efd4bab180d8afc8a80d20b36c9800f4091aca6ae267e AS builder

ARG TUSD_RELEASE=v2.8.0
ARG TUSD_AMD64_SHA256=33aaa15e14c7b025772d28605c6e0733ec2e8c1d6b646fa6b83af0049022a9ce
ARG TUSD_ARM64_SHA256=07f78ee2fd552296c40f3a7a5a06325a06b53f1dd1ba996a60ecc52696906481

# TODO: move this to base image
RUN apt-get update && apt-get install -y curl && \
  if [ $(arch) = "x86_64" ]; then \
  curl -fsSL -o /tmp/tusd.deb "https://github.com/tus/tusd/releases/download/${TUSD_RELEASE}/tusd_snapshot_amd64.deb" && \
  echo "${TUSD_AMD64_SHA256}  /tmp/tusd.deb" | sha256sum -c; \
  else \
  curl -fsSL -o /tmp/tusd.deb "https://github.com/tus/tusd/releases/download/${TUSD_RELEASE}/tusd_snapshot_arm64.deb" && \
  echo "${TUSD_ARM64_SHA256}  /tmp/tusd.deb" | sha256sum -c; \
  fi && \
  dpkg -i /tmp/tusd.deb && \
  rm -f /tmp/tusd.deb

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

FROM ghcr.io/immich-app/base-server-prod:202509210934@sha256:0c7eacf0ba88ca52e1a267cfc62d20d07792ea2c604818c2cbd37dc7dcefdac9

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  NVIDIA_DRIVER_CAPABILITIES=all \
  NVIDIA_VISIBLE_DEVICES=all

COPY --from=builder /usr/bin/tusd /usr/bin/tusd
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
