#!/bin/bash

set -e

LOCK=$(jq -c '.packages[] | select(.name == "libraw")' build-lock.json)
LIBRAW_VERSION=${LIBRAW_VERSION:=$(echo $LOCK | jq -r '.version')}
LIBRAW_SHA256=${LIBRAW_SHA256:=$(echo $LOCK | jq -r '.sha256')}

echo "$LIBRAW_SHA256  $LIBRAW_VERSION.tar.gz" > libraw.sha256
mkdir -p libraw
wget -nv https://github.com/libraw/libraw/archive/${LIBRAW_VERSION}.tar.gz
sha256sum -c libraw.sha256
tar -xvf ${LIBRAW_VERSION}.tar.gz -C libraw --strip-components=1
rm ${LIBRAW_VERSION}.tar.gz
rm libraw.sha256
cd libraw
autoreconf --install
./configure
make -j$(nproc)
make install
cd .. && rm -rf libraw
ldconfig /usr/local/lib
