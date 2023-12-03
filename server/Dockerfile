# dev build
FROM ghcr.io/immich-app/base-server-dev:20231201@sha256:4701c0c5920c78e73040dd2b74d22042ffce393f1a9d3453d90a0ecf81ff8649 as dev

WORKDIR /usr/src/app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server .


FROM dev AS prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional

# web build
FROM node:iron-alpine3.18 as web

WORKDIR /usr/src/app
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web .
RUN npm run build


# prod build
FROM ghcr.io/immich-app/base-server-prod:20231201@sha256:b8e86cf4c3cad872f54bab25a83f7503480049eea5c0ae36a8b8460b13cad3b5

WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin
COPY --from=web /usr/src/app/build ./www
COPY server/resources resources
COPY server/package.json server/package-lock.json ./
COPY server/start*.sh ./
RUN npm link && npm cache clean --force
COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
ENV PATH="${PATH}:/usr/src/app/bin"
VOLUME /usr/src/app/upload
EXPOSE 3001
ENTRYPOINT ["tini", "--", "/bin/sh"]
