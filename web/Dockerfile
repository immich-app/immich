FROM node:22.12.0-alpine3.20@sha256:96cc8323e25c8cc6ddcb8b965e135cfd57846e8003ec0d7bcec16c5fd5f6d39f

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
