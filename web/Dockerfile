FROM node:22.15.0-alpine3.20@sha256:686b8892b69879ef5bfd6047589666933508f9a5451c67320df3070ba0e9807b

RUN apk add --no-cache tini
USER node
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh"]
