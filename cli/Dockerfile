FROM ghcr.io/immich-app/base-server-dev:20231228@sha256:e631113b47c7e16a06ca47d3a99bdf269e831dfa4b94f6f4cc923781fa82c4e3 as test

WORKDIR /usr/src/app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY ./server/ .

WORKDIR /usr/src/app/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci
COPY ./cli/ .

FROM ghcr.io/immich-app/base-server-prod:20231228@sha256:e51e418d904124f368eca84b504414e40c5b55f9990be043d1749fdf5d1a045c

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["tini", "--", "/bin/sh"]
