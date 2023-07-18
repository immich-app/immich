#!/bin/bash

set -e

echo "$LIBVIPS_SHA256  vips-$LIBVIPS_VERSION.tar.xz" > libvips.sha256
mkdir -p libvips
wget https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.xz
sha256sum -c libvips.sha256
tar -xvf vips-${LIBVIPS_VERSION}.tar.xz -C libvips --strip-components=1
rm vips-${LIBVIPS_VERSION}.tar.xz
cd libvips
meson setup build --buildtype=release --libdir=lib -Dintrospection=false
cd build
# ninja test  # tests set concurrency too high for arm/v7
ninja install
cd .. && rm -rf libvips
ldconfig /usr/local/lib
