#!/bin/bash
# Check if diff only contains comments and description additions

echo "=== Checking mobile/openapi ==="
NON_COMMENT_CHANGES=$(git diff main -- mobile/openapi/ | grep -E "^\+[^+]" | grep -v "^\+[[:space:]]*//" | grep -v "^\+[[:space:]]*/\*" | grep -v "^\+[[:space:]]*\*" | grep -v "^+++" | wc -l)
if [ "$NON_COMMENT_CHANGES" -eq 0 ]; then
  echo "✓ Only comment changes in mobile/openapi"
else
  echo "✗ Found $NON_COMMENT_CHANGES non-comment additions in mobile/openapi"
fi

echo ""
echo "=== Checking open-api/typescript-sdk ==="
NON_COMMENT_CHANGES_TS=$(git diff main -- open-api/typescript-sdk/ | grep -E "^\+[^+]" | grep -v "^\+[[:space:]]*//" | grep -v "^\+[[:space:]]*/\*" | grep -v "^\+[[:space:]]*\*" | grep -v "^+++" | wc -l)
if [ "$NON_COMMENT_CHANGES_TS" -eq 0 ]; then
  echo "✓ Only comment changes in open-api/typescript-sdk"
else
  echo "✗ Found $NON_COMMENT_CHANGES_TS non-comment additions in open-api/typescript-sdk"
fi

echo ""
echo "=== Checking JSON spec for non-description changes ==="
NON_DESC_CHANGES=$(git diff main -- open-api/immich-openapi-specs.json | grep "^\+" | grep -v "description" | grep -v "^+++" | wc -l)
if [ "$NON_DESC_CHANGES" -eq 0 ]; then
  echo "✓ Only description additions in JSON spec"
else
  echo "✗ Found $NON_DESC_CHANGES non-description additions in JSON spec"
  echo "Showing non-description changes:"
  git diff main -- open-api/immich-openapi-specs.json | grep "^\+" | grep -v "description" | grep -v "^+++"
fi