FROM node:iron-alpine3.18@sha256:fe31b16ddfb4ba4ae1a42ea540e9e44b916d754e67c64642b090839a9b2ed0ee

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
