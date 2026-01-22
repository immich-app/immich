#!/bin/bash
# Auto-format files after Claude edits them
# Runs prettier to fix formatting issues before CI

FILE_PATH=$(jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Only process TypeScript, JavaScript, Svelte, JSON files
if [[ ! "$FILE_PATH" =~ \.(ts|js|svelte|json)$ ]]; then
  exit 0
fi

# Determine which package directory based on file path
if [[ "$FILE_PATH" == *"/server/"* ]]; then
  PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/server"
elif [[ "$FILE_PATH" == *"/web/"* ]]; then
  PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/web"
elif [[ "$FILE_PATH" == *"/cli/"* ]]; then
  PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/cli"
elif [[ "$FILE_PATH" == *"/e2e/"* ]]; then
  PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/e2e"
elif [[ "$FILE_PATH" == *"/open-api/"* ]]; then
  PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/open-api/typescript-sdk"
else
  exit 0
fi

# Check if package directory exists
if [[ ! -d "$PKG_DIR" ]]; then
  exit 0
fi

# Run prettier fix using pnpm (project uses pnpm workspaces)
cd "$PKG_DIR" && pnpm exec prettier --write "$FILE_PATH" 2>/dev/null

# Always exit 0 - don't block Claude on formatting issues
exit 0
