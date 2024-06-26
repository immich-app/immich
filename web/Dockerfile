FROM node:20.15.0-alpine3.20@sha256:0ccc08fadfe696f2959f59404ce0d90461c834a7465c4a563c62c0fef4089885

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
