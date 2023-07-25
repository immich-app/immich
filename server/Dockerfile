FROM node:18-bookworm@sha256:f4698d49371c8a9fa7dd78b97fb2a532213903066e47966542b3b1d403449da4 as builder

ENV IMAGEMAGICK_VERSION=7.1.1-13
ENV IMAGEMAGICK_SHA256=8e3ce1aaad19da9f2ca444072bcc631d193a219e3ee11c13ad6d3c895044142c
ENV LIBVIPS_VERSION=8.14.2
ENV LIBVIPS_SHA256=27dad021f0835a5ab14e541d02abd41e4c3bd012d2196438df5a9e754984f7ce
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -yqq ffmpeg build-essential ninja-build meson pkg-config \
libglib2.0-dev libexpat1-dev librsvg2-dev libexif-dev libwebp-dev liborc-0.4-dev libtiff5-dev \
libjpeg62-turbo-dev libgsf-1-dev libspng-dev libraw-dev libjxl-dev libheif-dev \
&& apt-get autoremove && apt-get clean && rm -rf /var/lib/apt/lists/*

# debian build for imagemagick has broken RAW support, so build manually
COPY bin/build_imagemagick.sh .
RUN ./build_imagemagick.sh
COPY bin/build_libvips.sh .
RUN ./build_libvips.sh

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional

FROM node:18-bookworm-slim

ENV NODE_ENV=production LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libmimalloc.so.2

WORKDIR /usr/src/app

RUN sed -i -e's/ main/ main contrib non-free non-free-firmware/g' /etc/apt/sources.list.d/debian.sources
RUN apt-get update && apt-get install -yqq ffmpeg tini libheif1 libwebp7 libwebpdemux2 libwebpmux3 \
libjpeg62-turbo libjxl0.7 libraw20 libtiff6 libspng0 libexif12 libgcc-s1 libglib2.0-0 \
libgsf-1-114 liblcms2-2 liborc-0.4-0 libopenexr-3-1-30 liblqr-1-0 libltdl7 zlib1g \
mesa-va-drivers libmimalloc2.0 $(if [ $(arch) = "x86_64" ]; then echo "intel-media-va-driver-non-free"; fi) \
&& apt-get autoremove && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=prod /usr/local/bin/magick /usr/local/bin/magick
COPY --from=prod /usr/local/include/ImageMagick-7 /usr/local/include/ImageMagick-7

COPY --from=prod /usr/local/bin/vips /usr/local/bin/vips
COPY --from=prod /usr/local/include/vips/ /usr/local/include/vips/

COPY --from=prod /usr/local/lib/ /usr/local/lib/

RUN ldconfig /usr/local/lib

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

ENTRYPOINT ["tini", "--", "/bin/sh"]
