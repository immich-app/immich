#!/bin/bash

set -e

LOCK=$(jq -c '.packages[] | select(.name == "libvips")' build-lock.json)
LIBVIPS_VERSION=${LIBVIPS_VERSION:=$(echo $LOCK | jq -r '.version')}
LIBVIPS_SHA256=${LIBVIPS_SHA256:=$(echo $LOCK | jq -r '.sha256')}

echo "$LIBVIPS_SHA256  vips-$LIBVIPS_VERSION.tar.xz" > libvips.sha256
mkdir -p libvips
wget -nv https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.xz
sha256sum -c libvips.sha256
tar -xvf vips-${LIBVIPS_VERSION}.tar.xz -C libvips --strip-components=1
rm vips-${LIBVIPS_VERSION}.tar.xz
rm libvips.sha256
cd libvips
meson setup build --buildtype=release --libdir=lib -Dintrospection=false -Dtiff=disabled
cd build
# ninja test  # tests set concurrency too high for arm/v7
ninja install
cd .. && rm -rf libvips
ldconfig /usr/local/lib
