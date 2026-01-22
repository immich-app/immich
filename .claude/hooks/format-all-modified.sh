#!/bin/bash
# Fix formatting and linting on all git-modified files when Claude stops
# Runs pnpm format:fix and lint:fix in packages that have changes

cd "${CLAUDE_PROJECT_DIR}/immich-fork" || exit 0

# Check for modified files in each package and run fixes
if git diff --name-only HEAD | grep -q "^server/"; then
  echo "Fixing server..."
  (cd server && pnpm format:fix 2>/dev/null && pnpm lint:fix 2>/dev/null)
fi

if git diff --name-only HEAD | grep -q "^web/"; then
  echo "Fixing web..."
  (cd web && pnpm format:fix 2>/dev/null && pnpm lint:fix 2>/dev/null)
fi

if git diff --name-only HEAD | grep -q "^cli/"; then
  echo "Fixing cli..."
  (cd cli && pnpm format:fix 2>/dev/null && pnpm lint:fix 2>/dev/null)
fi

if git diff --name-only HEAD | grep -q "^e2e/"; then
  echo "Fixing e2e..."
  (cd e2e && pnpm format:fix 2>/dev/null && pnpm lint:fix 2>/dev/null)
fi

exit 0
