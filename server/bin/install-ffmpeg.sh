#!/usr/bin/env bash

set -e

: "${FFMPEG_PLATFORM:=bookworm}"

echo Using platform $FFMPEG_PLATFORM

LOCK=$(jq -c '.packages[] | select(.name == "ffmpeg")' build-lock.json)
export TARGETARCH=${FFMPEG_PLATFORM}-${TARGETARCH:=$(dpkg --print-architecture)}
echo $TARGETARCH
FFMPEG_VERSION=${FFMPEG_VERSION:=$(echo $LOCK | jq -r '.version')}
FFMPEG_SHA256=${FFMPEG_SHA256:=$(echo $LOCK | jq -r '.sha256[$ENV.TARGETARCH]')}
echo $FFMPEG_SHA256

echo "$FFMPEG_SHA256  jellyfin-ffmpeg6_${FFMPEG_VERSION}-${FFMPEG_PLATFORM}_${TARGETARCH}.deb" > ffmpeg.sha256

wget -nv https://github.com/jellyfin/jellyfin-ffmpeg/releases/download/v${FFMPEG_VERSION}/jellyfin-ffmpeg6_${FFMPEG_VERSION}-${FFMPEG_PLATFORM}_${TARGETARCH}.deb
sha256sum -c ffmpeg.sha256
apt-get -y -f install ./jellyfin-ffmpeg6_${FFMPEG_VERSION}-${FFMPEG_PLATFORM}_${TARGETARCH}.deb
rm jellyfin-ffmpeg6_${FFMPEG_VERSION}-${FFMPEG_PLATFORM}_${TARGETARCH}.deb
rm ffmpeg.sha256
ldconfig /usr/lib/jellyfin-ffmpeg/lib

ln -s /usr/lib/jellyfin-ffmpeg/ffmpeg /usr/bin
ln -s /usr/lib/jellyfin-ffmpeg/ffprobe /usr/bin
