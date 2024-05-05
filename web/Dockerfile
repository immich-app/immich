FROM node:iron-alpine3.18@sha256:142644a60c2fd7b954d7de9dd3f2aba0ce9c99b14ce354ee2e65b47ee36f6baf

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
