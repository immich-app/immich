#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_FILE="${SCRIPT_DIR}/rknn_pool.cpp"
CXX="${CXX:-g++}"

RKNN_HEADER="${RKNN_HEADER:-/usr/include/rknn_api.h}"
RKNN_LIBRARY="${RKNN_LIBRARY:-/usr/lib/librknnrt.so}"
RKNN_OUTPUT_DIR="${RKNN_OUTPUT_DIR:-$SCRIPT_DIR}"

if [[ $# -ge 1 ]]; then
    RKNN_HEADER="$1"
fi
if [[ $# -ge 2 ]]; then
    RKNN_LIBRARY="$2"
fi
if [[ $# -ge 3 ]]; then
    RKNN_OUTPUT_DIR="$3"
fi

for file in "$SRC_FILE" "$RKNN_HEADER" "$RKNN_LIBRARY"; do
    if [[ ! -f "$file" ]]; then
        echo "Missing required file: $file" >&2
        exit 1
    fi
done

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to determine include paths." >&2
    exit 1
fi

read -r -a PYBIND_FLAGS <<<"$(python3 -m pybind11 --includes)"
EXT_SUFFIX="$(python3 - <<'PY'
import sysconfig
print(sysconfig.get_config_var("EXT_SUFFIX") or ".so")
PY
)"

INCLUDE_DIR="$(dirname "$(realpath "$RKNN_HEADER")")"
LIB_DIR="$(dirname "$(realpath "$RKNN_LIBRARY")")"
LIB_BASE="$(basename "$RKNN_LIBRARY")"
LIB_NAME="${LIB_BASE#lib}"
LIB_NAME="${LIB_NAME%%.so*}"

mkdir -p "$RKNN_OUTPUT_DIR"
OUTPUT_PATH="${RKNN_OUTPUT_DIR}/rknn_pool${EXT_SUFFIX}"

echo "[build-cross] Building ${OUTPUT_PATH}"

"$CXX" "$SRC_FILE" \
    -shared -o "$OUTPUT_PATH" \
    -O3 -DNDEBUG -std=c++17 -fPIC \
    -Wall -Wextra -Wno-unused-parameter \
    -D_DEFAULT_SOURCE -D_GNU_SOURCE \
    -Wl,-z,relro,-z,now \
    -Wl,-rpath,'\$ORIGIN' -Wl,-rpath,'\$ORIGIN/.' \
    "${PYBIND_FLAGS[@]}" \
    -I "$INCLUDE_DIR" \
    -L"$LIB_DIR" -l"$LIB_NAME" \
    -ldl -lpthread

echo "[build-cross] Done."
