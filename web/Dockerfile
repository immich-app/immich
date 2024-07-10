FROM node:20.15.1-alpine3.20@sha256:34b7aa411056c85dbf71d240d26516949b3f72b318d796c26b57caaa1df5639a

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
