FROM node:22.13.0-alpine3.20@sha256:db8dcb90326a0116375414e9a7c068a6b87a4422b7da37b5c6cd026f7c7835d3

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
