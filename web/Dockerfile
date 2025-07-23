FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e

RUN apk add --no-cache tini bash

USER node
WORKDIR /usr/src/app

COPY --chown=node:node ./web/package* ./web/

WORKDIR /usr/src/app/web
RUN npm ci

ENV CHOKIDAR_USEPOLLING=true \
  PATH="${PATH}:/usr/src/app/web/bin"
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
