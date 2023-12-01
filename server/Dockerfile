# dev build
FROM ghcr.io/immich-app/base-server-dev:20231130@sha256:2f3b4bc0b50a0710e4a0867b4842ebde3a709d18fd19b095b8bfb884082cfa18 as dev

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
FROM ghcr.io/immich-app/base-server-prod:20231130@sha256:dd91bfac4090357605a862823a99b50cf01cbc519723198f7aebb6b0517fab1d

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
