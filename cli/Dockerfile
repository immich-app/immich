FROM ghcr.io/immich-app/base-server-dev:20240130@sha256:a11ac5c56f0ccce1f218954c07c43caadf489557252ba5b9ca1c5977aaa25999 as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20240130@sha256:ce23a32154540b906df3c971766bcd991561c60331794e0ebb780947ac48113f

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
