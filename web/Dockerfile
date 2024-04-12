FROM node:iron-alpine3.18@sha256:3fb85a68652064ab109ed9730f45a3ede11f064afdd3ad9f96ef7e8a3c55f47e

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
