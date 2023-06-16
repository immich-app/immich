# Our Node base image
FROM node:20.3.0-alpine3.18@sha256:9c92cf1a355d10af63a57d2c71034a6ba36a571d9a83be354c0422f1e7ef6cec as base

WORKDIR /usr/src/app
EXPOSE 3000
RUN apk add --no-cache setpriv

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

FROM base

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/build ./build

COPY package.json package-lock.json ./
COPY entrypoint.sh ./

ENTRYPOINT ["/bin/sh"]

CMD ["entrypoint.sh"]
