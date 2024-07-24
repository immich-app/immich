FROM node:20.15.1-alpine3.20@sha256:c42da7e09507eb725474dd3dbcbee248cb90a7d489f0f9aeb5d3222eab0728c8

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
