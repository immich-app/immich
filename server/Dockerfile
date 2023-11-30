# dev build
FROM ghcr.io/immich-app/base-server-dev:20231125@sha256:f33b6eaf384e76ef3705a6e2cc76d276144ad6d3366b82f9b45b07d6a19285e2 as dev

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
FROM ghcr.io/immich-app/base-server-prod:20231125@sha256:a0e15f5bf87a97a79a399a5adffb5fe5befc18fb212e8341e744d958fe41e32a

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
