#!/bin/bash
set -eou pipefail

# Check if a specific tag was provided
if [ $# -eq 1 ]; then
    LATEST_TAG="$1"
    echo "Using specified tag: $LATEST_TAG"
else
    # Get the latest release
    RELEASE_API_URL="https://api.github.com/repos/extism/js-pdk/releases/latest"
    response=$(curl -s "$RELEASE_API_URL")
    if [ -z "$response" ]; then
        echo "Error: Failed to fetch the latest release from GitHub API."
        exit 1
    fi

    # try to parse tag
    LATEST_TAG=$(echo "$response" | grep -m 1 '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')

    if [ -z "$LATEST_TAG" ]; then
        echo "Error: Could not find the latest release tag."
        exit 1
    fi

    echo "Installing extism-js latest release with tag: $LATEST_TAG"
fi

OS=''
case `uname` in
  Darwin*)  OS="macos" ;;
  Linux*)   OS="linux" ;;
  *)        echo "unknown os: $OSTYPE" && exit 1 ;;
esac

ARCH=`uname -m`
case "$ARCH" in
  ix86*|x86_64*)    ARCH="x86_64" ;;
  arm64*|aarch64*)  ARCH="aarch64" ;;
  *)                echo "unknown arch: $ARCH" && exit 1 ;;
esac

BINARYEN_TAG="version_116"
DOWNLOAD_URL="https://github.com/extism/js-pdk/releases/download/$LATEST_TAG/extism-js-$ARCH-$OS-$LATEST_TAG.gz"

# Use /usr/local/bin directly (no sudo in Docker)
INSTALL_DIR="/usr/local/bin"

echo "Checking for binaryen..."

if ! which "wasm-merge" > /dev/null || ! which "wasm-opt" > /dev/null; then
  echo "Missing binaryen tool(s)"

  # binaryen use arm64 instead where as extism-js uses aarch64 for release file naming
  BINARYEN_ARCH="$ARCH"
  case "$BINARYEN_ARCH" in
    aarch64*)  BINARYEN_ARCH="arm64" ;;
  esac

  # matches the case where the user installs extism-pdk in a Linux-based Docker image running on mac m1
  # binaryen didn't have arm64 release file for linux 
  if [ $BINARYEN_ARCH = "arm64" ] && [ $OS = "linux" ]; then
    BINARYEN_ARCH="x86_64"
  fi

  if [ $OS = "macos" ]; then
    echo "Installing binaryen and wasm-merge using homebrew"
    brew install binaryen
  else
    if [ ! -e "binaryen-$BINARYEN_TAG-$BINARYEN_ARCH-$OS.tar.gz" ]; then
      echo 'Downloading binaryen...'
      curl -L -O "https://github.com/WebAssembly/binaryen/releases/download/$BINARYEN_TAG/binaryen-$BINARYEN_TAG-$BINARYEN_ARCH-$OS.tar.gz"
    fi
    rm -rf 'binaryen' "binaryen-$BINARYEN_TAG"
    tar xf "binaryen-$BINARYEN_TAG-$BINARYEN_ARCH-$OS.tar.gz"
    mv "binaryen-$BINARYEN_TAG"/ binaryen/
    mkdir -p /usr/local/binaryen
    if ! which 'wasm-merge' > /dev/null; then
      echo "Installing wasm-merge..."
      rm -f /usr/local/binaryen/wasm-merge
      mv binaryen/bin/wasm-merge /usr/local/binaryen/wasm-merge
      ln -s /usr/local/binaryen/wasm-merge /usr/local/bin/wasm-merge
    else
      echo "wasm-merge is already installed"
    fi
    if ! which 'wasm-opt' > /dev/null; then
      echo "Installing wasm-opt..."
      rm -f /usr/local/bin/wasm-opt
      mv binaryen/bin/wasm-opt /usr/local/binaryen/wasm-opt
      ln -s /usr/local/binaryen/wasm-opt /usr/local/bin/wasm-opt
    else
      echo "wasm-opt is already installed"
    fi
  fi
else
  echo "binaryen tools are already installed"
fi

TARGET="$INSTALL_DIR/extism-js"
echo "Downloading extism-js from: $DOWNLOAD_URL"

if curl -fsSL --output /tmp/extism-js.gz "$DOWNLOAD_URL"; then
  gunzip /tmp/extism-js.gz
  mv /tmp/extism-js "$TARGET"
  chmod +x "$TARGET"

  echo "Successfully installed extism-js to $TARGET"
else
  echo "Failed to download or install extism-js. Curl exit code: $?"
  exit 1
fi

# Warn the user if the chosen path is not in the path
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "Note: $INSTALL_DIR is not in your PATH. You may need to add it to your PATH or use the full path to run extism-js."
fi

echo "Installation complete. Try to run 'extism-js --version' to ensure it was correctly installed."