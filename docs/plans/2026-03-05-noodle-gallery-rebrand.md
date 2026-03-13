# Noodle Gallery Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a branding overlay system that transforms all user-visible "Immich" branding to "Noodle Gallery" at build time, while keeping internal code unchanged for upstream sync compatibility.

**Architecture:** A `branding/` directory at repo root contains config, asset placeholders, i18n overrides, and shell scripts. A composite GitHub Action runs the branding scripts after checkout in every build workflow. A verification script catches branding leaks.

**Tech Stack:** Bash (scripts), JSON (config/i18n), GitHub Actions (CI), `jq` and `sed` (text transforms)

---

### Task 1: Create `branding/config.json`

**Files:**

- Create: `branding/config.json`

**Step 1: Create the config file**

```json
{
  "name": "Noodle Gallery",
  "name_short": "Gallery",
  "name_slug": "noodle-gallery",
  "name_snake": "noodle_gallery",
  "description": "Self-hosted photo and video management solution",

  "mobile": {
    "bundle_id": "app.noodle.gallery",
    "bundle_id_debug": "app.noodle.gallery.debug",
    "bundle_id_profile": "app.noodle.gallery.profile",
    "deep_link_scheme": "noodle-gallery",
    "oauth_callback": "app.noodle.gallery:///oauth-callback",
    "shared_group": "group.app.noodle.gallery.share",
    "download_dir": "DCIM/NoodleGallery",
    "background_task_prefix": "app.noodle.gallery.background"
  },

  "docker": {
    "registry": "ghcr.io/open-noodle",
    "server_image": "noodle-gallery-server",
    "ml_image": "noodle-gallery-ml"
  },

  "cli": {
    "bin_name": "noodle-gallery",
    "config_dir_name": "noodle-gallery"
  },

  "docs": {
    "title": "Noodle Gallery",
    "url": "https://docs.noodle.gallery"
  },

  "upstream_name": "Immich",
  "upstream_name_lower": "immich"
}
```

**Step 2: Commit**

```bash
git add branding/config.json
git commit -m "feat(branding): add branding config for Noodle Gallery"
```

---

### Task 2: Create i18n override file

**Files:**

- Create: `branding/i18n/overrides-en.json`

**Step 1: Create the override file**

This file contains only the ~51 keys from `i18n/en.json` that reference "Immich", with "Immich" replaced by "Noodle Gallery" (or contextually appropriate variants).

```json
{
  "asset_offline_description": "This external library asset is no longer found on disk and has been moved to trash. If the file was moved within the library, check your timeline for the new corresponding asset. To restore this asset, please ensure that the file path below can be accessed by Noodle Gallery and scan the library.",
  "backup_onboarding_description": "A <backblaze-link>3-2-1 backup strategy</backblaze-link> is recommended to protect your data. You should keep copies of your uploaded photos/videos as well as the Noodle Gallery database for a comprehensive backup solution.",
  "backup_onboarding_footer": "For more information about backing up Noodle Gallery, please refer to the <link>documentation</link>.",
  "confirm_delete_library_assets": "Are you sure you want to delete this library? This will delete {count, plural, one {# contained asset} other {all # contained assets}} from Noodle Gallery and cannot be undone. Files will remain on disk.",
  "maintenance_restore_backup_description": "Noodle Gallery will be wiped and restored from the chosen backup. A backup will be created before continuing.",
  "maintenance_restore_backup_different_version": "This backup was created with a different version of Noodle Gallery!",
  "maintenance_settings_description": "Put Noodle Gallery into maintenance mode.",
  "notification_email_from_address_description": "Sender email address, for example: \"Noodle Gallery <noreply@example.com>\". Make sure to use an address you're allowed to send emails from.",
  "theme_custom_css_settings_description": "Cascading Style Sheets allow the design of Noodle Gallery to be customized.",
  "theme_settings_description": "Manage customization of the Noodle Gallery web interface",
  "advanced_settings_proxy_headers_subtitle": "Define proxy headers Noodle Gallery should send with each network request",
  "assets_deleted_permanently_from_server": "{count} asset(s) deleted permanently from the Noodle Gallery server",
  "assets_trashed_from_server": "{count} asset(s) trashed from the Noodle Gallery server",
  "background_location_permission_content": "In order to switch networks when running in the background, Noodle Gallery must *always* have precise location access so the app can read the Wi-Fi network's name",
  "backup_controller_page_background_battery_info_message": "For the best background backup experience, please disable any battery optimizations restricting background activity for Noodle Gallery.\n\nSince this is device-specific, please lookup the required information for your device manufacturer.",
  "buy": "Support Noodle Gallery",
  "cache_settings_subtitle": "Control the caching behaviour of the Noodle Gallery mobile application",
  "cleanup_confirm_description": "Noodle Gallery found {count} assets (created before {date}) safely backed up to the server. Remove the local copies from this device?",
  "cleanup_step4_summary": "{count} assets (created before {date}) to remove from your local device. Photos will remain accessible from the Noodle Gallery app.",
  "control_bottom_app_bar_delete_from_immich": "Delete from Noodle Gallery",
  "delete_dialog_alert": "These items will be permanently deleted from Noodle Gallery and from your device",
  "delete_dialog_alert_local": "These items will be permanently removed from your device but still be available on the Noodle Gallery server",
  "delete_dialog_alert_local_non_backed_up": "Some of the items aren't backed up to Noodle Gallery and will be permanently removed from your device",
  "delete_dialog_alert_remote": "These items will be permanently deleted from the Noodle Gallery server",
  "download_sucess_android": "The media has been downloaded to DCIM/NoodleGallery",
  "empty_trash_confirmation": "Are you sure you want to empty the trash? This will remove all the assets in trash permanently from Noodle Gallery.\nYou cannot undo this action!",
  "ignore_icloud_photos_description": "Photos that are stored on iCloud will not be uploaded to the Noodle Gallery server",
  "immich_logo": "Noodle Gallery Logo",
  "immich_web_interface": "Noodle Gallery Web Interface",
  "location_permission_content": "In order to use the auto-switching feature, Noodle Gallery needs precise location permission so it can read the current Wi-Fi network's name",
  "maintenance_description": "Noodle Gallery has been put into <link>maintenance mode</link>.",
  "manage_media_access_subtitle": "Allow the Noodle Gallery app to manage and move media files.",
  "obtainium_configurator_instructions": "Use Obtainium to install and update the Android app directly from Noodle Gallery GitHub's release. Create an API key and select a variant to create your Obtainium configuration link",
  "official_immich_resources": "Official Noodle Gallery Resources",
  "permission_onboarding_permission_denied": "Permission denied. To use Noodle Gallery, grant photo and video permissions in Settings.",
  "permission_onboarding_permission_limited": "Permission limited. To let Noodle Gallery backup and manage your entire gallery collection, grant photo and video permissions in Settings.",
  "permission_onboarding_request": "Noodle Gallery requires permission to view your photos and videos.",
  "purchase_activated_subtitle": "Thank you for supporting Noodle Gallery and open-source software",
  "purchase_button_buy_immich": "Support Noodle Gallery",
  "purchase_license_subtitle": "Support Noodle Gallery to fund the continued development of the service",
  "purchase_panel_info_1": "Building Noodle Gallery takes a lot of time and effort, and we have full-time engineers working on it to make it as good as we possibly can. Our mission is for open-source software and ethical business practices to become a sustainable income source for developers and to create a privacy-respecting ecosystem with real alternatives to exploitative cloud services.",
  "purchase_panel_info_2": "As we're committed not to add paywalls, this purchase will not grant you any additional features in Noodle Gallery. We rely on users like you to support Noodle Gallery's ongoing development.",
  "reset_sqlite_done": "App data has been cleared. Please restart Noodle Gallery and log in again.",
  "settings_require_restart": "Please restart Noodle Gallery to apply this setting",
  "support_third_party_description": "Your Noodle Gallery installation was packaged by a third-party. Issues you experience may be caused by that package, so please raise issues with them in the first instance using the links below.",
  "sync_upload_album_setting_subtitle": "Create and upload your photos and videos to the selected albums on Noodle Gallery",
  "trash_page_empty_trash_dialog_content": "Do you want to empty your trashed assets? These items will be permanently removed from Noodle Gallery",
  "upload_to_immich": "Upload to Noodle Gallery ({count})",
  "version_announcement_message": "Hi there! A new version of Noodle Gallery is available. Please take some time to read the <link>release notes</link> to ensure your setup is up-to-date to prevent any misconfigurations, especially if you use WatchTower or any mechanism that handles updating your Noodle Gallery instance automatically.",
  "welcome_to_immich": "Welcome to Noodle Gallery"
}
```

**Step 2: Commit**

```bash
git add branding/i18n/overrides-en.json
git commit -m "feat(branding): add i18n override strings for Noodle Gallery"
```

---

### Task 3: Create placeholder asset directory

**Files:**

- Create: `branding/assets/README.md`

**Step 1: Create asset directory with README checklist**

```markdown
# Noodle Gallery Brand Assets

Place your brand assets here. The `apply-branding.sh` script copies them into the
correct locations at build time.

## Required Assets

- [ ] `app-icon.png` — 1024x1024, no transparency
- [ ] `app-icon-adaptive-fg.png` — 108dp Android adaptive foreground
- [ ] `app-icon-adaptive-bg.png` — 108dp Android adaptive background
- [ ] `notification-icon.png` — 24x24 white silhouette
- [ ] `favicon.ico` — 32x32
- [ ] `favicon.png` — 180x180
- [ ] `splash.png` — 1152x1152 centered logo on solid bg
- [ ] `logo-inline-light.svg` + `.png` — horizontal wordmark, light bg
- [ ] `logo-inline-dark.svg` + `.png` — horizontal wordmark, dark bg
- [ ] `logo-stacked-light.svg` + `.png` — stacked logo, light bg
- [ ] `logo-stacked-dark.svg` + `.png` — stacked logo, dark bg

## Optional Assets

- [ ] `logo-mark.svg` — icon without text
- [ ] `og-image.png` — 1200x630 social preview
```

**Step 2: Commit**

```bash
git add branding/assets/README.md
git commit -m "feat(branding): add asset directory with checklist"
```

---

### Task 4: Write `apply-branding.sh` — i18n and web

**Files:**

- Create: `branding/scripts/apply-branding.sh`

**Step 1: Write the script header and config loading**

```bash
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
UPSTREAM_NAME=$(jq -r '.upstream_name' "$CONFIG")

# Mobile
BUNDLE_ID=$(jq -r '.mobile.bundle_id' "$CONFIG")
BUNDLE_ID_DEBUG=$(jq -r '.mobile.bundle_id_debug' "$CONFIG")
BUNDLE_ID_PROFILE=$(jq -r '.mobile.bundle_id_profile' "$CONFIG")
DEEP_LINK_SCHEME=$(jq -r '.mobile.deep_link_scheme' "$CONFIG")
OAUTH_CALLBACK=$(jq -r '.mobile.oauth_callback' "$CONFIG")
SHARED_GROUP=$(jq -r '.mobile.shared_group' "$CONFIG")
DOWNLOAD_DIR=$(jq -r '.mobile.download_dir' "$CONFIG")
BG_TASK_PREFIX=$(jq -r '.mobile.background_task_prefix' "$CONFIG")

# Docker
DOCKER_REGISTRY=$(jq -r '.docker.registry' "$CONFIG")
DOCKER_SERVER_IMAGE=$(jq -r '.docker.server_image' "$CONFIG")
DOCKER_ML_IMAGE=$(jq -r '.docker.ml_image' "$CONFIG")

# CLI
CLI_BIN_NAME=$(jq -r '.cli.bin_name' "$CONFIG")

# Docs
DOCS_TITLE=$(jq -r '.docs.title' "$CONFIG")
DOCS_URL=$(jq -r '.docs.url' "$CONFIG")

echo "=== Applying branding: $NAME ==="
```

**Step 2: Add i18n patching function**

Append to the same file:

```bash
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
```

**Step 3: Add web patching function**

Append to the same file:

```bash
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
    echo "  Patched OpenAPI spec"
  fi
}
```

**Step 4: Add asset overlay function**

Append to the same file:

```bash
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
```

**Step 5: Commit**

```bash
chmod +x branding/scripts/apply-branding.sh
git add branding/scripts/apply-branding.sh
git commit -m "feat(branding): add apply-branding.sh — i18n, web, and asset overlay"
```

---

### Task 5: Write `apply-branding.sh` — mobile platform configs

**Files:**

- Modify: `branding/scripts/apply-branding.sh`

**Step 1: Add Android patching function**

Append to `apply-branding.sh`:

```bash
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
```

**Step 2: Add iOS patching function**

Append to `apply-branding.sh`:

```bash
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
```

**Step 3: Commit**

```bash
git add branding/scripts/apply-branding.sh
git commit -m "feat(branding): add Android and iOS patching to apply-branding.sh"
```

---

### Task 6: Write `apply-branding.sh` — Docker, CLI, docs, and main entrypoint

**Files:**

- Modify: `branding/scripts/apply-branding.sh`

**Step 1: Add Docker patching function**

Append to `apply-branding.sh`:

```bash
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
}
```

**Step 2: Add CLI patching function**

```bash
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
```

**Step 3: Add docs patching function**

```bash
#
# --- Docs ---
#
patch_docs() {
  echo "--- Patching documentation ---"

  local docusaurus="$REPO_ROOT/docs/docusaurus.config.js"
  if [[ -f "$docusaurus" ]]; then
    sed -i "s/title: 'Immich'/title: '${NAME}'/g" "$docusaurus"
    sed -i "s|url: 'https://docs\.immich\.app'|url: '${DOCS_URL}'|g" "$docusaurus"
    echo "  Patched docusaurus.config.js"
  fi
}
```

**Step 4: Add main entrypoint that calls all functions**

Append to the bottom of `apply-branding.sh`:

```bash
#
# --- Main ---
#
main() {
  patch_i18n
  patch_web
  patch_assets
  patch_android
  patch_ios
  patch_docker
  patch_cli
  patch_docs
  echo "=== Branding applied successfully ==="
}

main "$@"
```

**Step 5: Commit**

```bash
git add branding/scripts/apply-branding.sh
git commit -m "feat(branding): add Docker, CLI, docs patching and main entrypoint"
```

---

### Task 7: Write `verify-branding.sh`

**Files:**

- Create: `branding/scripts/verify-branding.sh`

**Step 1: Write the verification script**

```bash
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
)

for file in "${check_files[@]}"; do
  filepath="$REPO_ROOT/$file"
  if [[ -f "$filepath" ]]; then
    # Case-sensitive grep for the upstream brand name
    if grep -q "$UPSTREAM_NAME" "$filepath"; then
      echo "  WARN: '$UPSTREAM_NAME' still found in $file"
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

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "=== Branding verification passed ==="
else
  echo "=== Branding verification FAILED — see warnings above ==="
fi

exit $EXIT_CODE
```

**Step 2: Make executable and commit**

```bash
chmod +x branding/scripts/verify-branding.sh
git add branding/scripts/verify-branding.sh
git commit -m "feat(branding): add verify-branding.sh for leak detection"
```

---

### Task 8: Create composite GitHub Action

**Files:**

- Create: `.github/actions/apply-branding/action.yml`

**Step 1: Write the action**

```yaml
name: Apply Branding
description: Replaces Immich branding with Noodle Gallery before build

runs:
  using: composite
  steps:
    - name: Install jq
      shell: bash
      run: |
        if ! command -v jq &>/dev/null; then
          sudo apt-get update && sudo apt-get install -y jq
        fi

    - name: Apply branding overlay
      shell: bash
      run: ./branding/scripts/apply-branding.sh

    - name: Verify branding applied
      shell: bash
      run: ./branding/scripts/verify-branding.sh
```

**Step 2: Commit**

```bash
git add .github/actions/apply-branding/action.yml
git commit -m "feat(ci): add composite GitHub Action for branding"
```

---

### Task 9: Add branding step to Docker workflow

**Files:**

- Modify: `.github/workflows/docker.yml`

**Step 1: Read the current docker workflow to understand its structure**

Run: `cat .github/workflows/docker.yml | head -80`

**Step 2: Add branding step after checkout**

In every job that builds Docker images, add this step immediately after `actions/checkout`:

```yaml
- uses: ./.github/actions/apply-branding
```

Also update the image name tags to use the config values. The exact changes depend on the workflow structure found in step 1.

**Step 3: Commit**

```bash
git add .github/workflows/docker.yml
git commit -m "feat(ci): add branding step to Docker workflow"
```

---

### Task 10: Add branding step to mobile, CLI, docs, and SDK workflows

**Files:**

- Modify: `.github/workflows/build-mobile.yml`
- Modify: `.github/workflows/cli.yml`
- Modify: `.github/workflows/docs-build.yml`
- Modify: `.github/workflows/docs-deploy.yml`
- Modify: `.github/workflows/sdk.yml`

**Step 1: Read each workflow file to understand structure**

**Step 2: Add branding step after checkout in each**

Same pattern — add `uses: ./.github/actions/apply-branding` after checkout in each workflow.

**Step 3: Commit**

```bash
git add .github/workflows/build-mobile.yml .github/workflows/cli.yml \
  .github/workflows/docs-build.yml .github/workflows/docs-deploy.yml \
  .github/workflows/sdk.yml
git commit -m "feat(ci): add branding step to mobile, CLI, docs, and SDK workflows"
```

---

### Task 11: Test locally

**Step 1: Run apply-branding.sh locally and check output**

```bash
./branding/scripts/apply-branding.sh
```

Expected: Each section prints patched files, no errors.

**Step 2: Run verify-branding.sh**

```bash
./branding/scripts/verify-branding.sh
```

Expected: All checks pass (or only warnings for files where "Immich" legitimately remains in non-user-facing positions like code comments).

**Step 3: Spot-check key files**

```bash
grep -n "title" web/src/routes/+layout.svelte | head -5
jq '.name' web/static/manifest.json
grep 'applicationId' mobile/android/app/build.gradle
grep 'PRODUCT_NAME' mobile/ios/Runner.xcodeproj/project.pbxproj | head -5
```

Expected: All show "Noodle Gallery" / `app.noodle.gallery`.

**Step 4: Reset working tree (branding is build-time only)**

```bash
git checkout -- .
```

**Step 5: Commit any script fixes discovered during testing**

---

### Task 12: Document the branding workflow

**Files:**

- Modify: `IMPROVEMENTS.md`

**Step 1: Add a "How to use" section**

Add to the top of the rebrand section in IMPROVEMENTS.md:

````markdown
### How to Use

**Local development (apply branding):**

```bash
./branding/scripts/apply-branding.sh
```
````

**Local development (reset to upstream branding):**

```bash
git checkout -- .
```

**After upstream merge:**

1. Merge upstream: `git fetch upstream && git merge upstream/main`
2. Resolve conflicts (if any in branding-touched files)
3. Run `./branding/scripts/verify-branding.sh` to check for new "Immich" strings
4. If new i18n keys were added upstream with "Immich", add overrides to `branding/i18n/overrides-en.json`

**CI:** Branding is applied automatically by the composite GitHub Action in all build workflows.

````

**Step 2: Commit**

```bash
git add IMPROVEMENTS.md
git commit -m "docs: add branding workflow usage instructions"
````

---

Plan complete and saved to `docs/plans/2026-03-05-noodle-gallery-rebrand.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints

Which approach?
