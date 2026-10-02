#!/usr/bin/env bash

set -e

if [ -n "$1" ]; then # the packages go to the directory given, which can be kept between runs, or to a temporary one
  dir=$1
else
  dir=$(mktemp -d)
  trap 'rm -rf "$dir"' EXIT
fi
mkdir -p "$dir"
cd "$dir"
urls=(
  https://github.com/intel/intel-graphics-compiler/releases/download/v2.36.3/intel-igc-core-2_2.36.3+21719_amd64.deb
  https://github.com/intel/intel-graphics-compiler/releases/download/v2.36.3/intel-igc-opencl-2_2.36.3+21719_amd64.deb
  https://github.com/intel/compute-runtime/releases/download/26.22.38646.4/intel-opencl-icd_26.22.38646.4-0_amd64.deb
  https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17537.24/intel-igc-core_1.0.17537.24_amd64.deb
  https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17537.24/intel-igc-opencl_1.0.17537.24_amd64.deb
  https://github.com/intel/compute-runtime/releases/download/24.35.30872.36/intel-opencl-icd-legacy1_24.35.30872.36_amd64.deb
  # TODO: Figure out how to get renovate to manage the differently versioned libigdgmm file
  https://github.com/intel/compute-runtime/releases/download/26.22.38646.4/libigdgmm12_22.10.0_amd64.deb
)
for url in "${urls[@]}"; do
  [ -f "${url##*/}" ] || curl -fsSLO "$url"
done
dpkg -i "${urls[@]##*/}"
