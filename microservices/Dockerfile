##################################
# DEVELOPMENT
##################################
FROM node:16-bullseye-slim AS development

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apt-get update
RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

RUN npm install

COPY . .

RUN npm run build

#################################
# PRODUCTION
#################################
FROM node:16-bullseye-slim AS production

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apt-get update
RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

RUN npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]