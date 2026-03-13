# Docker Publishing Workflow Design

## Goal

Re-enable Docker image publishing for the Noodle Gallery fork so users can pull pre-built images from GHCR.

## Design

### Trigger

- `workflow_dispatch` with a required `version` input (e.g. `v2.5.6-noodle.1`)
- Commented-out `push: branches: [main]` for easy future auto-publish

### Images

| Image                      | Registry               | Tags                            |
| -------------------------- | ---------------------- | ------------------------------- |
| `noodle-gallery-server`    | `ghcr.io/open-noodle/` | `<version>`, `latest`           |
| `noodle-gallery-ml` (CPU)  | `ghcr.io/open-noodle/` | `<version>`, `latest`           |
| `noodle-gallery-ml` (CUDA) | `ghcr.io/open-noodle/` | `<version>-cuda`, `latest-cuda` |

When auto-publish is enabled later, pushes to main tag as `main` / `main-cuda` instead of a version.

### Workflow structure

```
workflow_dispatch (input: version)
  ├── build-server (builds & pushes server image)
  └── build-ml (matrix: [cpu, cuda], builds & pushes ML images)
```

### Actions used

- `docker/login-action` — login to GHCR with `GITHUB_TOKEN`
- `docker/setup-buildx-action` — enable BuildKit
- `docker/build-push-action` — build and push

No `immich-app/devtools` dependencies. No extra secrets.

### What gets removed from current workflow

- `immich-app/devtools` action references (token creation, pre-job, success-check)
- Smart change-detection pre-job
- Re-tag jobs
- ROCm, OpenVINO, ARMNN, RKNN build variants
- DockerHub push

### Testing

Trigger with a test version (e.g. `v0.0.0-test.1`) to validate the workflow without creating a real release.

## Implementation steps

1. Replace `.github/workflows/docker.yml` with self-contained workflow
2. Re-enable the workflow: `gh workflow enable docker.yml`
3. Push to a branch, trigger manually with `v0.0.0-test.1`
4. Verify images appear at `ghcr.io/open-noodle/noodle-gallery-*`
5. Update `docker/docker-compose.yml` to reference fork images
6. Update `docker/example.env` with a note about fork versioning
