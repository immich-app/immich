#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$BRANDING_DIR")"
CONFIG="$BRANDING_DIR/config.json"

# Read config values
NAME=$(jq -r '.name' "$CONFIG")
NAME_SHORT=$(jq -r '.name_short' "$CONFIG")
NAME_SLUG=$(jq -r '.name_slug' "$CONFIG")
DESCRIPTION=$(jq -r '.description' "$CONFIG")

# Mobile
BUNDLE_ID=$(jq -r '.mobile.bundle_id' "$CONFIG")
BUNDLE_ID_DEBUG=$(jq -r '.mobile.bundle_id_debug' "$CONFIG")
BUNDLE_ID_PROFILE=$(jq -r '.mobile.bundle_id_profile' "$CONFIG")
DEEP_LINK_SCHEME=$(jq -r '.mobile.deep_link_scheme' "$CONFIG")
SHARED_GROUP=$(jq -r '.mobile.shared_group' "$CONFIG")
BG_TASK_PREFIX=$(jq -r '.mobile.background_task_prefix' "$CONFIG")

# Repository
REPO_NAME=$(jq -r '.repository.name' "$CONFIG")
REPO_URL=$(jq -r '.repository.url' "$CONFIG")
REPO_DOCS_URL=$(jq -r '.repository.docs_url' "$CONFIG")
REPO_ISSUES_URL=$(jq -r '.repository.issues_url' "$CONFIG")

# Docker
DOCKER_REGISTRY=$(jq -r '.docker.registry' "$CONFIG")
DOCKER_SERVER_IMAGE=$(jq -r '.docker.server_image' "$CONFIG")
DOCKER_ML_IMAGE=$(jq -r '.docker.ml_image' "$CONFIG")

# CLI
CLI_BIN_NAME=$(jq -r '.cli.bin_name' "$CONFIG")

# Docs
DOCS_URL=$(jq -r '.docs.url' "$CONFIG")

echo "=== Applying branding: $NAME ==="

#
# --- i18n ---
#
patch_i18n() {
  echo "--- Patching i18n strings ---"
  local overrides="$BRANDING_DIR/i18n/overrides-en.json"
  local target="$REPO_ROOT/i18n/en.json"

  if [[ -f "$overrides" ]]; then
    # Merge overrides into en.json (overrides take precedence)
    local tmp
    tmp=$(mktemp)
    jq -s '.[0] * .[1]' "$target" "$overrides" > "$tmp"
    mv "$tmp" "$target"
    echo "  Merged $(jq 'length' "$overrides") override keys into en.json"
  fi
}

#
# --- Web ---
#
patch_web() {
  echo "--- Patching web branding ---"

  # Page title in layout
  sed -i "s/- Immich<\/title>/- ${NAME}<\/title>/g" \
    "$REPO_ROOT/web/src/routes/+layout.svelte"

  # Noscript fallback in app.html
  sed -i "s/To use Immich,/To use ${NAME},/g" \
    "$REPO_ROOT/web/src/app.html"

  # manifest.json
  local manifest="$REPO_ROOT/web/static/manifest.json"
  if [[ -f "$manifest" ]]; then
    local tmp
    tmp=$(mktemp)
    jq --arg name "$NAME" --arg short "$NAME_SHORT" --arg desc "$DESCRIPTION" \
      '.name = $name | .short_name = $short | .description = $desc' \
      "$manifest" > "$tmp"
    mv "$tmp" "$manifest"
    echo "  Patched manifest.json"
  fi

  # OpenAPI spec
  local openapi="$REPO_ROOT/open-api/immich-openapi-specs.json"
  if [[ -f "$openapi" ]]; then
    local tmp
    tmp=$(mktemp)
    jq --arg name "$NAME" --arg desc "${NAME} API" \
      '.info.title = $name | .info.description = $desc' \
      "$openapi" > "$tmp"
    mv "$tmp" "$openapi"
    # Replace remaining user-facing "Immich" in API descriptions
    sed -i "s/Immich/${NAME}/g" "$openapi"
    echo "  Patched OpenAPI spec"
  fi
}

#
# --- Help Modal ---
#
patch_help_modal() {
  echo "--- Patching help modal URLs ---"
  local help_modal="$REPO_ROOT/web/src/lib/modals/HelpAndFeedbackModal.svelte"

  # Replace docs URL (backtick template literal → plain string)
  # Matching literal ${info.version} in Svelte template, not a shell variable
  # shellcheck disable=SC2016
  sed -i 's|`https://docs\.\${info\.version}\.archive\.immich\.app/overview/introduction`|'"'${REPO_DOCS_URL}'"'|g' "$help_modal"

  # Replace bugs/issues URL (only appears once, outside upstream section)
  sed -i "s|https://github\.com/immich-app/immich/issues/new/choose|${REPO_ISSUES_URL}|g" "$help_modal"

  # Replace primary source URL (with trailing slash — upstream section has no trailing slash)
  sed -i "s|https://github\.com/immich-app/immich/|${REPO_URL}|" "$help_modal"

  # Remove Discord link from primary section (outside BRANDING:UPSTREAM markers)
  local tmp
  tmp=$(mktemp)
  awk 'BEGIN{u=0} /BRANDING:UPSTREAM_START/{u=1} /BRANDING:UPSTREAM_END/{u=0; print; next} u==0 && /discord\.immich\.app/{next} {print}' "$help_modal" > "$tmp"
  mv "$tmp" "$help_modal"

  echo "  Patched HelpAndFeedbackModal.svelte"
}

#
# --- Assets ---
#
patch_assets() {
  echo "--- Overlaying brand assets ---"
  local assets="$BRANDING_DIR/assets"

  copy_if_exists() {
    local src="$1"
    shift
    if [[ -f "$src" ]]; then
      for dest in "$@"; do
        cp "$src" "$dest"
        echo "  $src -> $dest"
      done
    fi
  }

  # Favicons
  copy_if_exists "$assets/favicon.ico" \
    "$REPO_ROOT/web/static/favicon.ico" \
    "$REPO_ROOT/docs/static/img/favicon.ico"

  copy_if_exists "$assets/favicon.png" \
    "$REPO_ROOT/web/static/favicon.png" \
    "$REPO_ROOT/web/static/apple-icon-180.png" \
    "$REPO_ROOT/docs/static/img/favicon.png"

  # Sized favicons (generated from favicon.png if convert is available)
  if command -v convert &>/dev/null && [[ -f "$assets/favicon.png" ]]; then
    for size in 16 32 48 96 144; do
      convert "$assets/favicon.png" -resize "${size}x${size}" \
        "$REPO_ROOT/web/static/favicon-${size}.png"
    done
    echo "  Generated sized favicons"
  fi

  # PWA manifest icons
  copy_if_exists "$assets/app-icon.png" \
    "$REPO_ROOT/web/static/manifest-icon-192.maskable.png" \
    "$REPO_ROOT/web/static/manifest-icon-512.maskable.png"

  # Logo variants for web, docs, design, mobile
  copy_if_exists "$assets/logo-inline-light.svg" \
    "$REPO_ROOT/design/immich-logo-inline-light.svg" \
    "$REPO_ROOT/docs/static/img/immich-logo-inline-light.svg" \
    "$REPO_ROOT/mobile/assets/immich-logo-inline-light.svg"

  copy_if_exists "$assets/logo-inline-light.png" \
    "$REPO_ROOT/design/immich-logo-inline-light.png" \
    "$REPO_ROOT/docs/static/img/immich-logo-inline-light.png" \
    "$REPO_ROOT/mobile/assets/immich-logo-inline-light.png"

  copy_if_exists "$assets/logo-inline-dark.svg" \
    "$REPO_ROOT/design/immich-logo-inline-dark.svg" \
    "$REPO_ROOT/docs/static/img/immich-logo-inline-dark.svg" \
    "$REPO_ROOT/mobile/assets/immich-logo-inline-dark.svg"

  copy_if_exists "$assets/logo-inline-dark.png" \
    "$REPO_ROOT/design/immich-logo-inline-dark.png" \
    "$REPO_ROOT/docs/static/img/immich-logo-inline-dark.png" \
    "$REPO_ROOT/mobile/assets/immich-logo-inline-dark.png"

  copy_if_exists "$assets/logo-stacked-light.svg" \
    "$REPO_ROOT/design/immich-logo-stacked-light.svg" \
    "$REPO_ROOT/docs/static/img/immich-logo-stacked-light.svg"

  copy_if_exists "$assets/logo-stacked-light.png" \
    "$REPO_ROOT/design/immich-logo-stacked-light.png" \
    "$REPO_ROOT/docs/static/img/immich-logo-stacked-light.png"

  copy_if_exists "$assets/logo-stacked-dark.svg" \
    "$REPO_ROOT/design/immich-logo-stacked-dark.svg" \
    "$REPO_ROOT/docs/static/img/immich-logo-stacked-dark.svg"

  copy_if_exists "$assets/logo-stacked-dark.png" \
    "$REPO_ROOT/design/immich-logo-stacked-dark.png" \
    "$REPO_ROOT/docs/static/img/immich-logo-stacked-dark.png"

  # Mobile logo assets
  copy_if_exists "$assets/app-icon.png" \
    "$REPO_ROOT/mobile/assets/immich-logo.png" \
    "$REPO_ROOT/mobile/assets/immich-logo-w-bg.png" \
    "$REPO_ROOT/mobile/assets/immich-logo-w-bg-android.png" \
    "$REPO_ROOT/docs/static/img/color-logo.png"

  copy_if_exists "$assets/splash.png" \
    "$REPO_ROOT/mobile/assets/immich-splash.png" \
    "$REPO_ROOT/mobile/assets/immich-splash-android12.png"

  # Android drawable resources (all density buckets)
  for density in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
    local res_dir="$REPO_ROOT/mobile/android/app/src/main/res/drawable-${density}"
    copy_if_exists "$assets/splash.png" "$res_dir/splash.png"
    copy_if_exists "$assets/splash.png" "$res_dir/android12splash.png"
    copy_if_exists "$assets/notification-icon.png" "$res_dir/notification_icon.png"

    # Night variants
    local night_dir="$REPO_ROOT/mobile/android/app/src/main/res/drawable-night-${density}"
    if [[ -d "$night_dir" ]]; then
      copy_if_exists "$assets/splash.png" "$night_dir/splash.png"
      copy_if_exists "$assets/splash.png" "$night_dir/android12splash.png"
    fi
  done

  # Android mipmap launcher icons
  for density in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
    copy_if_exists "$assets/app-icon.png" \
      "$REPO_ROOT/mobile/android/app/src/main/res/mipmap-${density}/ic_launcher.png"
  done

  # Android adaptive icon foreground
  copy_if_exists "$assets/app-icon-adaptive-fg.png" \
    "$REPO_ROOT/mobile/assets/immich-logo-android-adaptive-icon.png"

  # Docs assets
  copy_if_exists "$assets/logo-mark.svg" \
    "$REPO_ROOT/docs/static/img/immich-logo.svg"
}

#
# --- Android ---
#
patch_android() {
  echo "--- Patching Android configs ---"

  local build_gradle="$REPO_ROOT/mobile/android/app/build.gradle"
  local manifest="$REPO_ROOT/mobile/android/app/src/main/AndroidManifest.xml"

  # build.gradle — applicationId and namespace
  sed -i "s/applicationId \"app\.alextran\.immich\"/applicationId \"${BUNDLE_ID}\"/g" "$build_gradle"
  sed -i "s/namespace \"app\.alextran\.immich\"/namespace \"${BUNDLE_ID}\"/g" "$build_gradle"

  # AndroidManifest.xml — app label
  sed -i "s/android:label=\"Immich\"/android:label=\"${NAME}\"/g" "$manifest"

  # AndroidManifest.xml — deep link scheme
  sed -i "s|<data android:scheme=\"immich\"|<data android:scheme=\"${DEEP_LINK_SCHEME}\"|g" "$manifest"

  # AndroidManifest.xml — deep link host
  sed -i "s|android:host=\"my\.immich\.app\"|android:host=\"my.noodle.gallery\"|g" "$manifest"

  # AndroidManifest.xml — OAuth callback
  sed -i "s|<data android:scheme=\"app\.immich\"|<data android:scheme=\"${BUNDLE_ID}\"|g" "$manifest"

  # AndroidManifest.xml — share intent labels
  sed -i "s/Upload to Immich/Upload to ${NAME}/g" "$manifest"

  echo "  Patched build.gradle and AndroidManifest.xml"
}

#
# --- iOS ---
#
patch_ios() {
  echo "--- Patching iOS configs ---"

  local pbxproj="$REPO_ROOT/mobile/ios/Runner.xcodeproj/project.pbxproj"
  local info_plist="$REPO_ROOT/mobile/ios/Runner/Info.plist"

  # project.pbxproj — bundle identifiers
  sed -i "s/app\.alextran\.immich\.vdebug/${BUNDLE_ID_DEBUG}/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.profile/${BUNDLE_ID_PROFILE}/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.Widget\.debug/${BUNDLE_ID_DEBUG}.Widget/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.Widget\.profile/${BUNDLE_ID_PROFILE}.Widget/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.Widget/${BUNDLE_ID}.Widget/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.ShareExtension\.debug/${BUNDLE_ID_DEBUG}.ShareExtension/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.ShareExtension\.profile/${BUNDLE_ID_PROFILE}.ShareExtension/g" "$pbxproj"
  sed -i "s/app\.alextran\.immich\.ShareExtension/${BUNDLE_ID}.ShareExtension/g" "$pbxproj"
  # Main bundle ID last (most general pattern)
  sed -i "s/app\.alextran\.immich/${BUNDLE_ID}/g" "$pbxproj"

  # project.pbxproj — product names
  sed -i "s/PRODUCT_NAME = \"Immich-Debug\"/PRODUCT_NAME = \"${NAME}-Debug\"/g" "$pbxproj"
  sed -i "s/PRODUCT_NAME = \"Immich-Profile\"/PRODUCT_NAME = \"${NAME}-Profile\"/g" "$pbxproj"
  sed -i "s/PRODUCT_NAME = Immich/PRODUCT_NAME = \"${NAME}\"/g" "$pbxproj"

  # Info.plist — bundle name
  sed -i "s|<string>immich_mobile</string>|<string>${NAME_SLUG}</string>|g" "$info_plist"

  # Info.plist — URL scheme for deep links
  sed -i "s|<string>immich</string>|<string>${DEEP_LINK_SCHEME}</string>|g" "$info_plist"

  # Info.plist — background task identifiers
  sed -i "s/app\.alextran\.immich\.background/${BG_TASK_PREFIX}/g" "$info_plist"
  sed -i "s/app\.alextran\.immich\.backgroundFetch/${BUNDLE_ID}.backgroundFetch/g" "$info_plist"
  sed -i "s/app\.alextran\.immich\.backgroundProcessing/${BUNDLE_ID}.backgroundProcessing/g" "$info_plist"

  # Shared app group
  local entitlements
  for entitlements in "$REPO_ROOT"/mobile/ios/Runner/*.entitlements; do
    if [[ -f "$entitlements" ]]; then
      sed -i "s/group\.app\.immich\.share/${SHARED_GROUP}/g" "$entitlements"
    fi
  done

  echo "  Patched project.pbxproj, Info.plist, and entitlements"
}

#
# --- Docker ---
#
patch_docker() {
  echo "--- Patching Docker configs ---"

  local compose_dir="$REPO_ROOT/docker"
  for f in "$compose_dir"/docker-compose*.yml; do
    if [[ -f "$f" ]]; then
      # Replace upstream image references
      sed -i "s|ghcr\.io/immich-app/immich-server|${DOCKER_REGISTRY}/${DOCKER_SERVER_IMAGE}|g" "$f"
      sed -i "s|ghcr\.io/immich-app/immich-machine-learning|${DOCKER_REGISTRY}/${DOCKER_ML_IMAGE}|g" "$f"
      echo "  Patched $(basename "$f")"
    fi
  done

  # Append branding env vars to example.env
  local env_example="$REPO_ROOT/docker/example.env"
  if [[ -f "$env_example" ]]; then
    cat >> "$env_example" <<EOF

# ${NAME} branding
IMMICH_REPOSITORY=${REPO_NAME}
IMMICH_REPOSITORY_URL=${REPO_URL}
EOF
    echo "  Added branding env vars to example.env"
  fi
}

#
# --- CLI ---
#
patch_cli() {
  echo "--- Patching CLI ---"

  local cli_pkg="$REPO_ROOT/cli/package.json"
  if [[ -f "$cli_pkg" ]]; then
    local tmp
    tmp=$(mktemp)
    jq --arg bin "$CLI_BIN_NAME" \
      '.bin = { ($bin): "./bin/immich" } | .description = "Command Line Interface (CLI) for Noodle Gallery"' \
      "$cli_pkg" > "$tmp"
    mv "$tmp" "$cli_pkg"
    echo "  Patched cli/package.json bin name"
  fi
}

#
# --- Docs ---
#
patch_docs() {
  echo "--- Patching documentation ---"

  local docusaurus="$REPO_ROOT/docs/docusaurus.config.js"
  if [[ -f "$docusaurus" ]]; then
    sed -i "s/title: 'Immich'/title: '${NAME}'/g" "$docusaurus"
    sed -i "s|url: 'https://docs\.immich\.app'|url: '${DOCS_URL}'|g" "$docusaurus"
    # Replace remaining user-facing "Immich" references (navbar, footer, etc.)
    sed -i "s/Immich/${NAME}/g" "$docusaurus"
    echo "  Patched docusaurus.config.js"
  fi
}

#
# --- Main ---
#
main() {
  patch_i18n
  patch_web
  patch_help_modal
  patch_assets
  patch_android
  patch_ios
  patch_docker
  patch_cli
  patch_docs
  echo "=== Branding applied successfully ==="
}

main "$@"
