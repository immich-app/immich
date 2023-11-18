FROM ghcr.io/immich-app/base-server-dev:20231109 as builder

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json cli/test/ ./
RUN npm ci
COPY ./cli/ .

FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional


FROM ghcr.io/immich-app/base-server-prod:20231109


VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
