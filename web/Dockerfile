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

FROM base

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/build ./build

COPY package.json package-lock.json ./
COPY entrypoint.sh ./

ENTRYPOINT ["tini", "--", "/bin/sh"]

CMD ["entrypoint.sh"]
