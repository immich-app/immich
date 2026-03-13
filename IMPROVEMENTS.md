# Improvements

## Rebrand: Immich -> Noodle Gallery

### Strategy

Branding overlay — a `branding/` directory in the fork containing config, assets, i18n overrides, and scripts. Internal code stays "immich" for upstream sync compatibility.

### How to Use

**Local development (apply branding):**

```bash
./branding/scripts/apply-branding.sh
```

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

### What changes at build time

1. All user-visible "Immich" text -> "Noodle Gallery" (web, mobile, CLI, docs, OpenAPI)
2. All visual assets -> Noodle Gallery logos/icons/splash
3. Mobile bundle IDs -> `app.noodle.gallery`
4. Docker images -> `ghcr.io/open-noodle/gallery-server` / `gallery-ml`
5. CLI binary -> `noodle-gallery`
6. Deep link scheme -> `noodle-gallery://`

### What stays "immich"

- Package names, npm scopes, env vars, database name, Docker Compose service names, API paths, all source code identifiers

### Branding Overlay Directory Structure

```
branding/
├── config.json              # Brand name, bundle IDs, domain, etc.
├── assets/                  # All visual assets (see checklist below)
├── i18n/
│   └── overrides-en.json    # Only the i18n keys that mention "Immich"
└── scripts/
    ├── apply-branding.sh    # Applies config + assets before build
    └── verify-branding.sh   # Sanity check for branding leaks
```

### `branding/config.json`

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
    "download_dir": "DCIM/NoodleGallery"
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

### Files Patched by `apply-branding.sh`

#### Web
- `web/src/app.html` — page title
- `web/src/routes/+layout.svelte` — title fallback
- `web/src/lib/constants.ts` — hardcoded product name strings
- `web/static/` — favicon and static brand assets

#### i18n Strings
- `i18n/en.json` (and other locales) — merge override keys (~15-20 keys like `welcome_to_immich`, `immich_logo`, `immich_web_interface`, `buy_immich`, etc.)

#### Mobile — Android
- `mobile/android/app/build.gradle` — applicationId
- `mobile/android/app/src/main/AndroidManifest.xml` — app label, deep link scheme, OAuth callback
- `mobile/android/app/src/main/res/` — launcher icons, splash screens, notification icon
- `mobile/assets/` — logo and splash assets

#### Mobile — iOS
- `mobile/ios/Runner.xcodeproj/project.pbxproj` — bundle identifier, product name
- `mobile/ios/Runner/Info.plist` — bundle name, deep link scheme, OAuth callback
- `mobile/ios/Runner/Assets.xcassets/` — AppIcon image set

#### Docker
- `docker/docker-compose.yml` (and other compose files) — image references
- Dockerfiles — LABEL metadata

#### CLI
- `cli/package.json` — bin name
- `cli/src/` — user-facing help text strings

#### Documentation
- `docs/docusaurus.config.js` — title, tagline, URL, org name
- `docs/static/img/` — logo/favicon assets
- `README.md` — header, badges, project description

#### OpenAPI Spec
- `open-api/immich-openapi-specs.json` — title and description

#### Design Assets
- `design/` — all `immich-logo-*` files

### Assets Checklist

Must-have for launch:

- [ ] **App icon** — 1024x1024 PNG, no transparency (iOS App Store, Android Play Store, web favicon source)
- [ ] **Android adaptive icon foreground** — 108dp foreground layer PNG
- [ ] **Android adaptive icon background** — 108dp background layer PNG
- [ ] **Notification icon** — 24x24 white silhouette PNG (Android notifications)
- [ ] **Favicon .ico** — 32x32 (web browser tabs)
- [ ] **Favicon .png** — 180x180 (web bookmarks, Apple touch icon)
- [ ] **Splash screen** — 1152x1152 centered logo on solid background (mobile app launch)
- [ ] **Logo inline light** — horizontal wordmark, SVG + PNG (web header, docs header)
- [ ] **Logo inline dark** — horizontal wordmark, SVG + PNG (dark mode)
- [ ] **Logo stacked light** — stacked logo, SVG + PNG (about dialogs, README)
- [ ] **Logo stacked dark** — stacked logo, SVG + PNG (dark mode)

Nice-to-have:

- [ ] **Logo mark only** — icon without text, SVG (small UI contexts, loading states)
- [ ] **Open Graph image** — 1200x630 PNG (social media link previews)
- [ ] **Docs hero image** — screenshot or marketing image (README, docs landing)

### Asset file naming in `branding/assets/`

```
branding/assets/
├── app-icon.png                    # 1024x1024 master
├── app-icon-adaptive-fg.png        # Android adaptive foreground
├── app-icon-adaptive-bg.png        # Android adaptive background
├── notification-icon.png           # 24x24 silhouette
├── favicon.ico
├── favicon.png
├── splash.png
├── logo-inline-light.svg
├── logo-inline-light.png
├── logo-inline-dark.svg
├── logo-inline-dark.png
├── logo-stacked-light.svg
├── logo-stacked-light.png
├── logo-stacked-dark.svg
├── logo-stacked-dark.png
└── logo-mark.svg
```

### CI/CD: Composite GitHub Action

```
.github/actions/apply-branding/
└── action.yml
```

Inserted into every build workflow after checkout:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/apply-branding
  - name: Build ...
    run: ...
```

Affected workflows:
- Docker build & push (server + ML images)
- Mobile build (Android APK/AAB, iOS IPA)
- CLI build
- Docs deploy
- SDK build (OpenAPI spec title)
