# Our Node base image
FROM node:20.8-alpine3.18 as base

WORKDIR /usr/src/app
EXPOSE 3000
RUN apk add --no-cache setpriv tini

FROM base as builder

RUN chown node:node /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000

FROM builder AS dev
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
CMD ["npm", "run", "dev"]

FROM builder AS prod

RUN npm run build
RUN npm prune --omit=dev

FROM ghcr.io/nginxinc/nginx-unprivileged:1.25.1-alpine3.17@sha256:c38e27fdba47f725f49177b88fdd1fd2feef11b13dc11dea3695c3feb2c6d96d

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY nginx/10-listen-on-ipv6-by-default.sh /docker-entrypoint.d
COPY nginx/15-set-env-variables.envsh /docker-entrypoint.d

COPY nginx/templates/ /etc/nginx/templates

COPY --from=prod /usr/src/app/build /usr/share/nginx/html
