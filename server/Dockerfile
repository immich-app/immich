# Build stage
FROM node:16-slim as builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apt-get -qq update > /dev/null && \
    apt-get -qq -y --no-install-recommends install \
      build-essential \
      python3 \
      libheif-dev \
      libvips-dev \
      ffmpeg > /dev/null && \
    apt-get -qq -y clean > /dev/null && apt-get -qq -y autoremove && apt-get -qq -y purge --auto-remove && rm -rf /var/lib/apt/lists/*

RUN npm ci

COPY . .

RUN npm run build

# Prod stage
FROM node:16-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY start-server.sh start-microservices.sh ./

RUN mkdir -p /usr/src/app/dist

RUN apt-get -qq update > /dev/null && \
    apt-get -qq install -y --no-install-recommends \
      libheif-dev \
      libvips-dev \
      ffmpeg > /dev/null && \
    apt-get -qq -y clean > /dev/null && apt-get -qq autoremove -y > /dev/null && apt-get -qq purge -y --auto-remove > /dev/null && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

RUN npm prune --production

VOLUME /usr/src/app/upload

EXPOSE 3001
