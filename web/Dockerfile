FROM node:22.14.0-alpine3.20@sha256:40be979442621049f40b1d51a26b55e281246b5de4e5f51a18da7beb6e17e3f9

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
