# Our Node base image
FROM node:16-alpine3.14 as base

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

RUN apk add --no-cache setpriv

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

EXPOSE 3000

FROM base AS dev
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
CMD ["npm", "run", "dev"]

FROM base as prod
ENV NODE_ENV=production
