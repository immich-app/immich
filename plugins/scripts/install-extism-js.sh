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
case $(uname) in
  Darwin*)  OS="macos" ;;
  Linux*)   OS="linux" ;;
  *)        echo "unknown os: $OSTYPE" && exit 1 ;;
esac

ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

# Map architecture names for downloads
EXTISM_ARCH="$ARCH"
BINARYEN_ARCH="$ARCH"

case "$ARCH" in
  ix86*|x86_64*)    
    EXTISM_ARCH="x86_64"
    BINARYEN_ARCH="x86_64"
    ;;
  arm64*|aarch64*)  
    EXTISM_ARCH="aarch64"
    BINARYEN_ARCH="aarch64"
    ;;
  *)                
    echo "unknown arch: $ARCH" && exit 1 
    ;;
esac

echo "Using OS: $OS, Architecture for extism-js: $EXTISM_ARCH, Architecture for binaryen: $BINARYEN_ARCH"

BINARYEN_TAG="version_124"
DOWNLOAD_URL="https://github.com/extism/js-pdk/releases/download/$LATEST_TAG/extism-js-$EXTISM_ARCH-$OS-$LATEST_TAG.gz"

echo "Download URL: $DOWNLOAD_URL"

# Use /usr/local/bin directly (no sudo in Docker)
INSTALL_DIR="/usr/local/bin"

echo "Checking for binaryen..."

# Check if tools exist and are executable
NEEDS_INSTALL=false
if ! command -v wasm-merge > /dev/null 2>&1 || ! command -v wasm-opt > /dev/null 2>&1; then
  NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
  echo "Installing binaryen tools..."

  if [ "$OS" = "macos" ]; then
    echo "Installing binaryen using homebrew"
    brew install binaryen
  else
    echo "Downloading binaryen for $OS/$BINARYEN_ARCH..."
    BINARYEN_DOWNLOAD_URL="https://github.com/WebAssembly/binaryen/releases/download/$BINARYEN_TAG/binaryen-$BINARYEN_TAG-$BINARYEN_ARCH-$OS.tar.gz"

    echo "Binaryen download URL: $BINARYEN_DOWNLOAD_URL"
    
    curl -fsSL -o "/tmp/binaryen.tar.gz" "$BINARYEN_DOWNLOAD_URL"
    
    # Extract to /tmp
    cd /tmp
    tar xzf binaryen.tar.gz
    
    # The extracted directory name
    BINARYEN_DIR="/tmp/binaryen-$BINARYEN_TAG"
    
    if [ ! -d "$BINARYEN_DIR" ]; then
      echo "Error: Failed to extract binaryen to $BINARYEN_DIR"
      ls -la /tmp/
      exit 1
    fi
    
    # Install the binaries
    mkdir -p "$INSTALL_DIR"
    
    echo "Installing wasm-merge to $INSTALL_DIR..."
    cp "$BINARYEN_DIR/bin/wasm-merge" "$INSTALL_DIR/wasm-merge"
    chmod +x "$INSTALL_DIR/wasm-merge"
    
    echo "Installing wasm-opt to $INSTALL_DIR..."
    cp "$BINARYEN_DIR/bin/wasm-opt" "$INSTALL_DIR/wasm-opt"
    chmod +x "$INSTALL_DIR/wasm-opt"
    
    # Cleanup
    cd -
    rm -rf "$BINARYEN_DIR" /tmp/binaryen.tar.gz
    
    echo "Binaryen tools installed successfully"
  fi
  
  # Verify installation
  if ! command -v wasm-merge > /dev/null 2>&1; then
    echo "Error: wasm-merge not found after installation"
    exit 1
  fi
  
  if ! command -v wasm-opt > /dev/null 2>&1; then
    echo "Error: wasm-opt not found after installation"
    exit 1
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

echo "Installation complete. Verifying installations..."
echo "wasm-merge location: $(command -v wasm-merge || echo 'NOT FOUND')"
echo "wasm-opt location: $(command -v wasm-opt || echo 'NOT FOUND')"
echo "extism-js location: $(command -v extism-js || echo 'NOT FOUND')"
echo ""
echo "Try to run 'extism-js --version' to ensure it was correctly installed."