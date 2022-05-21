# Our Node base image
FROM node:16-alpine3.14 as base

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000
EXPOSE 24678

FROM base AS dev
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "run", "dev"]

FROM node:16-alpine3.14 as prod

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node . .

RUN npm install

EXPOSE 3000


# Issue build command in entrypoint.sh to capture user .env file instead of the builder .env file.
