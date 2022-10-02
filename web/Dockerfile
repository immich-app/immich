# Our Node base image
FROM node:16-alpine3.14 as base

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

WORKDIR /usr/src/app

RUN apk add --no-cache setpriv

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN   chown -R node:0 /usr/src/app \
  &&  chmod -R g=u /usr/src/app

RUN addgroup node root
USER node
EXPOSE 3000

FROM base AS dev
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
CMD ["npm", "run", "dev"]

FROM base as prod
ENV NODE_ENV=production
