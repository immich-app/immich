# Releases

Gallery uses **git tags as the single source of truth** for versioning. Every push to `main` automatically triggers a release.

## How It Works

1. A PR is merged to `main`
2. The `gallery-release.yml` workflow runs automatically
3. It computes the next version from the latest `v*.*.*` git tag:
   - `changelog:feat` PR label or `feat:` commit prefix → **minor** bump
   - `changelog:fix` PR label or `fix:` commit prefix → **patch** bump
   - `BREAKING CHANGE` in commit body → **major** bump
   - No indicators → **patch** bump by default
4. The [branding script](/developer/branding) stamps the computed version into all packages
5. Multi-arch Docker images are built and pushed to `ghcr.io/open-noodle/`
6. Three git tags are created:
   - `vX.Y.Z` — the specific version (e.g., `v4.20.0`)
   - `vX` — floats to the latest release in that major (e.g., `v4`)
   - `release` — always points to the latest build
7. A GitHub Release is created with auto-generated changelog, noting which upstream Immich version the release is based on

## Manual Override

You can trigger a release manually via **Actions → Release → Run workflow** and provide a specific version tag (e.g., `v5.0.0`). This skips the auto-bump logic.

## Version in Source Files

Source files (`package.json`, `pubspec.yaml`, `pyproject.toml`) contain the **upstream Immich version** — not the Gallery version. This avoids merge conflicts during upstream rebases. The branding script overwrites these at build time with the Gallery version from git tags.

In local development, the server reports the upstream Immich version. This is expected — branding only runs during CI builds.

## Docker Image Tags

Users pin their deployments with the `IMMICH_VERSION` env var in `docker-compose.yml`:

| Tag              | Example   | Behavior                  |
| ---------------- | --------- | ------------------------- |
| Specific version | `v4.20.0` | Pinned to exact release   |
| Major version    | `v4`      | Floats to latest `v4.x.x` |
| `release`        | `release` | Always latest build       |

## Upstream Tracking

The upstream Immich version is recorded in `branding/config.json` under `upstream.version`. This is updated during rebases and included in GitHub Release notes.

## Mobile Version Compatibility

The mobile app checks that its major version matches the server's major version at login. Since branding stamps the same Gallery version into both the server `package.json` and mobile `pubspec.yaml`, this check passes for production builds. In local dev, both report the upstream version, so the check also passes.

The mobile build number (`versionCode` for Play Store) is controlled by the `BUILD_NUMBER` env var, which defaults to `1` for local builds and can be set to `$GITHUB_RUN_NUMBER` in CI for monotonically increasing values.
