#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$BRANDING_DIR")"
CONFIG="$BRANDING_DIR/config.json"

NAME=$(jq -r '.name' "$CONFIG")
UPSTREAM_NAME=$(jq -r '.upstream_name' "$CONFIG")
DEEP_LINK_SCHEME=$(jq -r '.mobile.deep_link_scheme' "$CONFIG")
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
  "web/src/lib/modals/ServerAboutModal.svelte"
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

# Files where ALL `github.com/immich-app/immich` references must be patched away
url_check_files=(
  "web/src/lib/components/shared-components/side-bar/server-status.svelte"
  "web/src/lib/modals/VersionAnnouncementModal.svelte"
  "web/src/lib/components/layouts/ErrorLayout.svelte"
  "web/static/.well-known/security.txt"
)

for file in "${url_check_files[@]}"; do
  filepath="$REPO_ROOT/$file"
  if [[ -f "$filepath" ]]; then
    if grep -q "github\.com/immich-app/immich" "$filepath"; then
      echo "  WARN: Upstream GitHub URL still present in $file"
      EXIT_CODE=1
    else
      echo "  OK: $file"
    fi
  fi
done

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

# Check Dockerfiles for upstream repo references
echo "--- Checking Dockerfiles ---"
for dockerfile in "server/Dockerfile" "machine-learning/Dockerfile"; do
  filepath="$REPO_ROOT/$dockerfile"
  if [[ -f "$filepath" ]]; then
    if grep -q "immich-app/immich" "$filepath"; then
      echo "  WARN: Upstream repo reference found in $dockerfile"
      EXIT_CODE=1
    else
      echo "  OK: $dockerfile"
    fi
  fi
done

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

# Open-in-app scheme registration: web rewrite + Android/iOS dual-scheme
echo "--- Checking open-in-app scheme registration ---"

open_in_app="$REPO_ROOT/web/src/lib/utils/open-in-app.ts"
if [[ -f "$open_in_app" ]]; then
  if grep -q "immich://" "$open_in_app"; then
    echo "  FAIL: open-in-app.ts still contains 'immich://' — branding rewrite did not run"
    EXIT_CODE=1
  elif ! grep -q "${DEEP_LINK_SCHEME}://" "$open_in_app"; then
    echo "  FAIL: open-in-app.ts does not contain '${DEEP_LINK_SCHEME}://'"
    EXIT_CODE=1
  else
    echo "  OK: open-in-app.ts uses ${DEEP_LINK_SCHEME}://"
  fi
else
  echo "  FAIL: open-in-app.ts not found at $open_in_app"
  EXIT_CODE=1
fi

android_manifest="$REPO_ROOT/mobile/android/app/src/main/AndroidManifest.xml"
if [[ -f "$android_manifest" ]]; then
  if ! grep -q "android:scheme=\"immich\"" "$android_manifest"; then
    echo "  FAIL: AndroidManifest.xml missing android:scheme=\"immich\" (legacy scheme must remain)"
    EXIT_CODE=1
  elif ! grep -q "android:scheme=\"${DEEP_LINK_SCHEME}\"" "$android_manifest"; then
    echo "  FAIL: AndroidManifest.xml missing android:scheme=\"${DEEP_LINK_SCHEME}\""
    EXIT_CODE=1
  else
    echo "  OK: AndroidManifest.xml registers both immich and ${DEEP_LINK_SCHEME}"
  fi
fi

info_plist="$REPO_ROOT/mobile/ios/Runner/Info.plist"
if [[ -f "$info_plist" ]]; then
  # CFBundleURLSchemes entries sit at 4-tab indent; anchor to that to avoid matching
  # CFBundleName (<string>${NAME_SLUG}</string>) at 1-tab indent.
  # Use $'\t' ANSI-C quoting for literal tabs — BSD grep (macOS) lacks -P.
  indent=$'\t\t\t\t'
  if ! grep -q "^${indent}<string>immich</string>" "$info_plist"; then
    echo "  FAIL: Info.plist missing <string>immich</string> in CFBundleURLSchemes (legacy scheme must remain)"
    EXIT_CODE=1
  elif ! grep -q "^${indent}<string>${DEEP_LINK_SCHEME}</string>" "$info_plist"; then
    echo "  FAIL: Info.plist missing <string>${DEEP_LINK_SCHEME}</string> in CFBundleURLSchemes"
    EXIT_CODE=1
  else
    echo "  OK: Info.plist CFBundleURLSchemes registers both immich and ${DEEP_LINK_SCHEME}"
  fi
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "Open-in-app scheme registration verified"
fi

echo "--- Checking mobile image assets ---"
if ! bash "$SCRIPT_DIR/verify-mobile-assets.sh"; then
  EXIT_CODE=1
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "=== Branding verification passed ==="
else
  echo "=== Branding verification FAILED — see warnings above ==="
fi

exit $EXIT_CODE
