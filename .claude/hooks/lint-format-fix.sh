#!/bin/bash
# Auto-format and lint-fix files after Claude edits them
# Runs prettier then eslint --fix to address CI failures

FILE_PATH=$(jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Only process TypeScript, JavaScript, Svelte files
if [[ ! "$FILE_PATH" =~ \.(ts|js|svelte)$ ]]; then
  exit 0
fi

# Determine which package directory based on file path
case "$FILE_PATH" in
  */server/*)   PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/server" ;;
  */web/*)      PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/web" ;;
  */cli/*)      PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/cli" ;;
  */e2e/*)      PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/e2e" ;;
  */open-api/*) PKG_DIR="${CLAUDE_PROJECT_DIR}/immich-fork/open-api/typescript-sdk" ;;
  *) exit 0 ;;
esac

# Check if package directory exists
if [[ ! -d "$PKG_DIR" ]]; then
  exit 0
fi

cd "$PKG_DIR" || exit 0

# Format first (prettier), then lint fix (eslint) - using pnpm
pnpm exec prettier --write "$FILE_PATH" 2>/dev/null
pnpm exec eslint --fix "$FILE_PATH" 2>/dev/null

# Always exit 0 - don't block Claude on issues that can't be auto-fixed
exit 0
