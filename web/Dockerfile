FROM node:iron-alpine3.18@sha256:d328c7bc3305e1ab26491817936c8151a47a8861ad617c16c1eeaa9c8075c8f6

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
