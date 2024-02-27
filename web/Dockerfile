FROM node:iron-alpine3.18@sha256:f3299f16246c71ab8b304d6745bb4059fa9283e8d025972e28436a9f9b36ed24

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
