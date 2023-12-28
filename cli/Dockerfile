FROM ghcr.io/immich-app/base-server-dev:20231109@sha256:19fa55f76f4de1ebda8b6d8e881a57bc0b367354a2cbb101ced21663e83d38c9 as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20231109@sha256:c17af3a0b949279f1a5eb342ab9e90fefe88a73718c0f46b033e66a9462fd9d9

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
