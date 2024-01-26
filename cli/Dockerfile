FROM ghcr.io/immich-app/base-server-dev:20240125@sha256:93500f94a6008c27123499c8918efa7c0cf1b0d08dba4ede7239d2bc6fa3cc27 as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20240125@sha256:6cafd57bb0d048ad03719c8e2ca5af3c59e421d75da11e9843d29db749b65eb7

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
