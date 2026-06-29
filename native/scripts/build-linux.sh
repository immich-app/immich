#!/usr/bin/env bash
# Cross-build the napi addon for Linux server (x86_64 + aarch64) via zigbuild
# (no Docker) and stage as .node under dist/server/<target>/.
# In CI you'd build these natively per-arch instead; this is local convenience.
set -euo pipefail
cd "$(dirname "$0")/.."

CRATE=immich_core_napi

for t in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu; do
    rustup target add "$t" >/dev/null 2>&1 || true
    cargo zigbuild -p "$CRATE" --target "$t" --release
    mkdir -p "dist/server/$t"
    cp "target/$t/release/lib${CRATE}.so" "dist/server/$t/immich_core_napi.node"
done

echo "linux -> dist/server/*/immich_core_napi.node"
