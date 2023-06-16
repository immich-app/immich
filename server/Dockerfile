FROM node:18.16.0-alpine3.18@sha256:f41850f74ff16a33daff988e2ea06ef8f5daeb6fb84913c7df09552a98caba09 as builder

WORKDIR /usr/src/app

RUN apk add --update-cache build-base imagemagick-dev python3 ffmpeg libraw-dev perl vips-dev vips-heif vips-magick

COPY package.json package-lock.json ./

RUN npm ci

COPY . .


FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional


FROM node:18.16.0-alpine3.18@sha256:f41850f74ff16a33daff988e2ea06ef8f5daeb6fb84913c7df09552a98caba09

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache ffmpeg imagemagick-dev libraw-dev perl vips-dev vips-heif vips-magick

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE
COPY package.json package-lock.json ./
COPY start*.sh ./

RUN npm link && npm cache clean --force

VOLUME /usr/src/app/upload

EXPOSE 3001

ENTRYPOINT ["/bin/sh"]
