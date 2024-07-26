FROM node:20.16.0-alpine3.20@sha256:aada767bf3e4b4a1437642b81db7d8bb99a6dba27627088e4608772f1f02ebc0

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
