FROM ghcr.io/immich-app/base-server-dev:20231221@sha256:6746ca1c430578ae05b3a28554e584bece81ef80ee1c9e13b2323fb42c59a0fa as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20231221@sha256:12156a036d4099f4975ed0744e468319a66c75536f2fa71959f47e5f4ff5dc7b

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
