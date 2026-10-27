#!/usr/bin/env bash
# =============================================================================
# immich-go build & cross-compile helper
#
#   ./scripts/build.sh                 # build both binaries for the host
#   ./scripts/build.sh arm64           # cross-compile for ODROID-C2 (ARM64)
#   ./scripts/build.sh amd64
#
# Output lands in ./dist/<arch>/ as fully static binaries (CGO_ENABLED=0),
# so they run on any Linux with the matching CPU — including DietPi/alpine.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

ARCH="${1:-$(go env GOARCH)}"
OUT="dist/${ARCH}"

export CGO_ENABLED=0
export GOOS=linux
export GOARCH="$ARCH"

mkdir -p "$OUT"
LDFLAGS="-s -w"

echo ">> building immich-server  (linux/$ARCH)"
go build -trimpath -ldflags "$LDFLAGS" -o "$OUT/immich-server"  ./cmd/server

echo ">> building immich-migrate (linux/$ARCH)"
go build -trimpath -ldflags "$LDFLAGS" -o "$OUT/immich-migrate" ./cmd/migrate

echo ">> done:"
ls -lh "$OUT"
echo
echo "Deploy example (ODROID-C2 over ssh):"
echo "  scp $OUT/immich-server root@odroid-c2.local:/usr/local/bin/"
