# Our Node base image
FROM node:16-alpine3.14 as base

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

RUN apk add --no-cache setpriv

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000

FROM base AS dev
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 24678
CMD ["npm", "run", "dev"]

FROM base as prod
COPY --chown=node:node . .
ENV NODE_ENV=production


# Issue build command in entrypoint.sh to capture user .env file instead of the builder .env file.
