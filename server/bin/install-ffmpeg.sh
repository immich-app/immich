#!/bin/bash

set -e

LOCK=$(jq -c '.packages[] | select(.name == "ffmpeg")' build-lock.json)
export TARGETARCH=${TARGETARCH:=$(dpkg --print-architecture)}
FFMPEG_VERSION=${FFMPEG_VERSION:=$(echo $LOCK | jq -r '.version')}
FFMPEG_SHA256=${FFMPEG_SHA256:=$(echo $LOCK | jq -r '.sha256[$ENV.TARGETARCH]')}

echo "$FFMPEG_SHA256  jellyfin-ffmpeg6_${FFMPEG_VERSION}-bookworm_${TARGETARCH}.deb" > ffmpeg.sha256

wget -nv https://github.com/jellyfin/jellyfin-ffmpeg/releases/download/v${FFMPEG_VERSION}/jellyfin-ffmpeg6_${FFMPEG_VERSION}-bookworm_${TARGETARCH}.deb
sha256sum -c ffmpeg.sha256
apt-get -yqq -f install ./jellyfin-ffmpeg6_${FFMPEG_VERSION}-bookworm_${TARGETARCH}.deb
rm jellyfin-ffmpeg6_${FFMPEG_VERSION}-bookworm_${TARGETARCH}.deb
rm ffmpeg.sha256
ldconfig /usr/lib/jellyfin-ffmpeg/lib

ln -s /usr/lib/jellyfin-ffmpeg/ffmpeg /usr/bin
ln -s /usr/lib/jellyfin-ffmpeg/ffprobe /usr/bin
