#!/usr/bin/env bash
# Requires cargo-zigbuild and Zig on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v cargo-zigbuild >/dev/null; then
    echo "cargo-zigbuild is required" >&2
    exit 1
fi

CRATE=immich_core_napi

for t in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
    rustup target add "$t" >/dev/null 2>&1 || true
    cargo zigbuild -p "$CRATE" --target "$t" --release
    mkdir -p "dist/server/$t"
    cp "target/$t/release/lib${CRATE}.so" "dist/server/$t/immich_core_napi.node"
done

echo "linux -> dist/server/*/immich_core_napi.node"
