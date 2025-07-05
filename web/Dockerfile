FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e

RUN apk add --no-cache tini make

USER node
WORKDIR /usr/src/app
COPY --chown=node:node ./web ./web/
COPY --chown=node:node ./open-api ./open-api/
COPY --chown=node:node Makefile ./

WORKDIR /usr/src/app/web
RUN umask 000 && \
  find /usr/src/app -type d -exec chmod o+rwx {} \; && \
  find /usr/src/app -type f -exec chmod o+rw {} \; && \
  npm ci

ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
