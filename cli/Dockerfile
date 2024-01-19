FROM ghcr.io/immich-app/base-server-dev:20240111@sha256:5acf773796f93c7a3216ffdbdb3604dc812f2b2317b84a1b57b65674826b746a as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20240111@sha256:e917605008977f68dc3b6f7879c264cae4bff6c4186b119a6e114a60f8f5a354

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
