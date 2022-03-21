##################################
# DEVELOPMENT
##################################
FROM node:16-alpine3.14 AS development

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# RUN apk add --update-cache build-base python3 libheif vips-dev vips ffmpeg

RUN npm install

COPY . .

RUN npm run build

#################################
# PRODUCTION
#################################
FROM node:16-alpine3.14 AS production

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# RUN apk add --update-cache build-base python3 libheif vips-dev vips ffmpeg

RUN npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]