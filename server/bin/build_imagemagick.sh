#!/bin/bash

set -e

echo "$IMAGEMAGICK_SHA256  $IMAGEMAGICK_VERSION.tar.gz" > imagemagick.sha256
mkdir -p ImageMagick
wget https://github.com/ImageMagick/ImageMagick/archive/${IMAGEMAGICK_VERSION}.tar.gz
sha256sum -c imagemagick.sha256
tar -xvf ${IMAGEMAGICK_VERSION}.tar.gz -C ImageMagick --strip-components=1
rm ${IMAGEMAGICK_VERSION}.tar.gz
# curl -L https://github.com/ImageMagick/ImageMagick/archive/${IMAGEMAGICK_VERSION}.tar.gz \
# | tee >(sha256sum -c imagemagick.sha256) | tar -zxv -C ImageMagick --strip-components=1
cd ImageMagick
./configure --with-modules
make -j$(nproc)
make install
cd .. && rm -rf ImageMagick
ldconfig /usr/local/lib