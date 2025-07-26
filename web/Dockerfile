FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e

ARG WEB_USER=1000
ARG WEB_GROUP=1000

RUN apk add --no-cache tini bash

USER $WEB_USER:$WEB_GROUP
WORKDIR /usr/src/app/web
COPY --chown=${WEB_USER}:${WEB_GROUP} ./web/package* ./

WORKDIR /usr/src/app/web
RUN npm ci

ENV CHOKIDAR_USEPOLLING=true \
  PATH="${PATH}:/usr/src/app/web/bin"
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["tini", "--", "/bin/bash", "-c"]
