FROM ghcr.io/immich-app/base-server-dev:20231109 as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20231109

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
