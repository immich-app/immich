# Docker Publishing Workflow

## Overview

The Release workflow (`.github/workflows/docker.yml`) builds and publishes multi-arch Docker images to GHCR on every push to `main` or via manual `workflow_dispatch`.

## Images

| Image               | Registry               | Platforms                    | Tags                                             |
| ------------------- | ---------------------- | ---------------------------- | ------------------------------------------------ |
| `gallery-server`    | `ghcr.io/open-noodle/` | `linux/amd64`, `linux/arm64` | `<version>`, `<major>`, `release`                |
| `gallery-ml` (CPU)  | `ghcr.io/open-noodle/` | `linux/amd64`, `linux/arm64` | `<version>`, `<major>`, `release`                |
| `gallery-ml` (CUDA) | `ghcr.io/open-noodle/` | `linux/amd64` only           | `<version>-cuda`, `<major>-cuda`, `release-cuda` |

CUDA stays amd64-only because the `nvidia/cuda` base image does not support ARM.

## How Multi-Arch Builds Work

The workflow uses the same pattern as upstream Immich: **per-platform native builds + manifest merge**.

```
version (compute next semver tag)
  ├── build-server (matrix: amd64 on ubuntu-latest, arm64 on ubuntu-24.04-arm)
  │     └── pushes single-platform image by digest, uploads digest as artifact
  ├── build-ml (matrix: device × platform)
  │     └── same pattern — pushes by digest, uploads artifact
  ├── merge-server (downloads digests, creates multi-arch manifest with version tags)
  ├── merge-ml (per device: downloads digests, creates multi-arch manifest)
  └── tag (creates git tags: vX.Y.Z, vX, release)
```

### Why native runners instead of QEMU?

- `ubuntu-24.04-arm` runners are free for public repos
- Native ARM builds are 3-4x faster than QEMU-emulated builds
- Matches upstream Immich's approach

### Push-by-digest pattern

Each platform build uses `docker/build-push-action` with:

```
outputs: type=image,"name=ghcr.io/open-noodle/gallery-server",push-by-digest=true,name-resolution=short,push=true
```

This pushes the image without any tag, returning only a digest (sha256 hash). The digest is saved as an empty file and uploaded as a GitHub Actions artifact. The merge job then downloads all digest artifacts and runs:

```bash
docker buildx imagetools create -t <tag1> -t <tag2> ... <image>@sha256:<digest1> <image>@sha256:<digest2>
```

This creates a single manifest list (multi-arch image) pointing to both platform-specific images.

### Cache scoping

Each platform gets its own GHA cache scope to prevent cross-platform cache pollution:

- `scope=server-linux-amd64`, `scope=server-linux-arm64`
- `scope=ml-cpu-linux-amd64`, `scope=ml-cpu-linux-arm64`
- `scope=ml-cuda-linux-amd64`

## Version Computation

When triggered without an explicit version:

1. Finds the latest `v*.*.*` git tag
2. Checks the merge commit message and PR labels for bump type:
   - `BREAKING CHANGE` -> major bump
   - `feat` prefix or `changelog:feat` label -> minor bump
   - Everything else -> patch bump
3. Tags the resulting images and creates git tags after all builds succeed

Manual override: pass a `version` input (e.g. `v4.9.0`) to `workflow_dispatch`.

## Triggering a Test Build

To test without affecting the release tag:

```bash
gh workflow run docker.yml --ref <branch> -f version=v0.0.0-test.1
```

This builds and pushes images tagged `v0.0.0-test.1` but also creates git tags, so use a throwaway version string.
