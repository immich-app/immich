#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$BRANDING_DIR")"
CONFIG="$BRANDING_DIR/config.json"

NAME=$(jq -r '.name' "$CONFIG")
UPSTREAM_NAME=$(jq -r '.upstream_name' "$CONFIG")
EXIT_CODE=0

echo "=== Verifying branding: $NAME ==="

# Files where upstream name must NOT appear in user-facing positions
check_files=(
  "web/src/routes/+layout.svelte"
  "web/src/app.html"
  "web/static/manifest.json"
  "mobile/android/app/src/main/AndroidManifest.xml"
  "mobile/android/app/build.gradle"
  "docs/docusaurus.config.js"
  "open-api/immich-openapi-specs.json"
  "cli/package.json"
  "web/src/lib/modals/HelpAndFeedbackModal.svelte"
)

for file in "${check_files[@]}"; do
  filepath="$REPO_ROOT/$file"
  if [[ -f "$filepath" ]]; then
    # Exclude known code-internal patterns (function names, class names, CSS classes)
    matches=$(grep -c "$UPSTREAM_NAME" "$filepath" 2>/dev/null || true)
    allowed=$(grep -cE "(Immich(App|Service|Link)|immich-|bg-immich|getMyImmich|// .*[Ii]mmich)" "$filepath" 2>/dev/null || true)
    if [[ "$matches" -gt 0 && "$matches" -gt "$allowed" ]]; then
      echo "  WARN: '$UPSTREAM_NAME' still found in $file ($matches hits, $allowed allowed)"
      EXIT_CODE=1
    else
      echo "  OK: $file"
    fi
  fi
done

# Check i18n — verify overrides were applied
i18n_file="$REPO_ROOT/i18n/en.json"
overrides_file="$BRANDING_DIR/i18n/overrides-en.json"
if [[ -f "$overrides_file" && -f "$i18n_file" ]]; then
  override_count=$(jq 'length' "$overrides_file")
  leaked=0
  for key in $(jq -r 'keys[]' "$overrides_file"); do
    value=$(jq -r --arg k "$key" '.[$k]' "$i18n_file")
    if echo "$value" | grep -q "$UPSTREAM_NAME"; then
      echo "  WARN: i18n key '$key' still contains '$UPSTREAM_NAME'"
      leaked=$((leaked + 1))
      EXIT_CODE=1
    fi
  done
  echo "  i18n: $((override_count - leaked))/$override_count keys patched"
fi

# Check iOS bundle ID
pbxproj="$REPO_ROOT/mobile/ios/Runner.xcodeproj/project.pbxproj"
if [[ -f "$pbxproj" ]]; then
  if grep -q "app\.alextran\.immich" "$pbxproj"; then
    echo "  WARN: Old bundle ID still found in project.pbxproj"
    EXIT_CODE=1
  else
    echo "  OK: project.pbxproj"
  fi
fi

# Check that hardcoded upstream URLs are patched in user-facing frontend
echo "--- Checking URL replacements ---"
help_modal="$REPO_ROOT/web/src/lib/modals/HelpAndFeedbackModal.svelte"
if [[ -f "$help_modal" ]]; then
  # Extract content outside BRANDING:UPSTREAM markers
  outside_upstream=$(sed '/BRANDING:UPSTREAM_START/,/BRANDING:UPSTREAM_END/d' "$help_modal")
  if echo "$outside_upstream" | grep -q "github\.com/immich-app/immich"; then
    echo "  WARN: Upstream GitHub URL found outside upstream section in HelpAndFeedbackModal.svelte"
    EXIT_CODE=1
  else
    echo "  OK: HelpAndFeedbackModal.svelte (URLs patched)"
  fi
fi

# Verify Docker env vars are set
env_example="$REPO_ROOT/docker/example.env"
if [[ -f "$env_example" ]]; then
  if grep -q "IMMICH_REPOSITORY=" "$env_example"; then
    echo "  OK: example.env has IMMICH_REPOSITORY"
  else
    echo "  WARN: example.env missing IMMICH_REPOSITORY"
    EXIT_CODE=1
  fi
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "=== Branding verification passed ==="
else
  echo "=== Branding verification FAILED — see warnings above ==="
fi

exit $EXIT_CODE
