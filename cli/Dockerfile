FROM ghcr.io/immich-app/base-server-dev:20240118@sha256:92de0ebf1bc2ccc6b7d11023e31b010dc79dd7e16df04146820d2d2cc2e5bf9f as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20240118@sha256:5b78cefcc3c3dda2a48fd22c7b0fd6453cfc5ae61258ff5a082cc9563c4e3c25

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
