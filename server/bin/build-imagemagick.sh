#!/usr/bin/env bash

set -e

LOCK=$(jq -c '.packages[] | select(.name == "imagemagick")' build-lock.json)
IMAGEMAGICK_VERSION=${IMAGEMAGICK_VERSION:=$(echo $LOCK | jq -r '.version')}
IMAGEMAGICK_SHA256=${IMAGEMAGICK_SHA256:=$(echo $LOCK | jq -r '.sha256')}

echo "$IMAGEMAGICK_SHA256  $IMAGEMAGICK_VERSION.tar.gz" > imagemagick.sha256
mkdir -p ImageMagick
wget -nv https://github.com/ImageMagick/ImageMagick/archive/${IMAGEMAGICK_VERSION}.tar.gz
sha256sum -c imagemagick.sha256
tar -xvf ${IMAGEMAGICK_VERSION}.tar.gz -C ImageMagick --strip-components=1
rm ${IMAGEMAGICK_VERSION}.tar.gz
rm imagemagick.sha256
cd ImageMagick
./configure --with-modules
make -j$(nproc)
make install
cd .. && rm -rf ImageMagick
ldconfig /usr/local/lib
