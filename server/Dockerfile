FROM node:20.8-bookworm as builder

WORKDIR /usr/src/app

COPY bin/install-ffmpeg.sh build-lock.json ./
RUN sed -i -e's/ main/ main contrib non-free non-free-firmware/g' /etc/apt/sources.list.d/debian.sources
RUN apt-get update && apt-get install -yqq build-essential ninja-build meson pkg-config jq zlib1g autoconf \
libglib2.0-dev libexpat1-dev librsvg2-dev libexif-dev libwebp-dev liborc-0.4-dev \
libjpeg62-turbo-dev libgsf-1-dev libspng-dev libjxl-dev libheif-dev liblcms2-2 \
mesa-va-drivers libmimalloc2.0 $(if [ $(arch) = "x86_64" ]; then echo "intel-media-va-driver-non-free"; fi) \
&& ./install-ffmpeg.sh && apt-get autoremove && apt-get clean && rm -rf /var/lib/apt/lists/*

# debian build for imagemagick has broken RAW support, so build manually
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
ENV LD_RUN_PATH=/usr/local/lib:$LD_RUN_PATH
COPY bin/build-libraw.sh bin/build-imagemagick.sh bin/build-libvips.sh bin/use-camera-wb.patch ./
RUN ./build-libraw.sh
RUN ./build-imagemagick.sh
RUN ./build-libvips.sh

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

FROM builder as prod

RUN npm run build
RUN npm prune --omit=dev --omit=optional

FROM node:20.8-bookworm

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY bin/install-ffmpeg.sh build-lock.json ./
RUN sed -i -e's/ main/ main contrib non-free non-free-firmware/g' /etc/apt/sources.list.d/debian.sources
RUN apt-get update && apt-get install -yqq tini libheif1 libwebp7 libwebpdemux2 libwebpmux3 mesa-va-drivers \
libjpeg62-turbo libexpat1 librsvg2-2 libjxl0.7 libspng0 libexif12 libgcc-s1 libglib2.0-0 \
libgsf-1-114 libopenjp2-7 liblcms2-2 liborc-0.4-0 libopenexr-3-1-30 liblqr-1-0 libltdl7 zlib1g libgomp1 \
mesa-va-drivers libmimalloc2.0 $(if [ $(arch) = "x86_64" ]; then echo "intel-media-va-driver-non-free"; fi) jq wget \
&& ./install-ffmpeg.sh && apt-get remove -yqq jq wget && apt-get autoremove -yqq && apt-get clean && rm -rf /var/lib/apt/lists/* \
&& rm install-ffmpeg.sh && rm build-lock.json

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
