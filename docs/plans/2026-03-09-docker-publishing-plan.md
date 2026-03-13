# Docker Publishing Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the upstream-dependent Docker workflow with a self-contained one that publishes server and ML images to GHCR on manual trigger.

**Architecture:** Single workflow file with `workflow_dispatch` trigger and a version input. Two parallel jobs (server, ML matrix) using standard `docker/build-push-action`. Tags images with the user-provided version and `latest`.

**Tech Stack:** GitHub Actions, `docker/build-push-action`, `docker/login-action`, `docker/setup-buildx-action`, GHCR

---

### Task 1: Replace Docker workflow

**Files:**

- Modify: `.github/workflows/docker.yml`

**Step 1: Replace the workflow file**

Replace the entire contents of `.github/workflows/docker.yml` with:

```yaml
name: Docker

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag (e.g. v2.5.6-noodle.1)'
        required: true
        type: string
  # Uncomment to auto-publish on push to main:
  # push:
  #   branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions: {}

jobs:
  build-server:
    name: Build & Push Server
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2 # v3.10.0

      - name: Login to GHCR
        uses: docker/login-action@74a5d142397b4f367a81961eba4e8cd7edddf772 # v3.4.0
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@263435318d21b8e681c14492fe198e362a7d2c83 # v6.18.0
        with:
          context: .
          file: server/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/noodle-gallery-server:${{ inputs.version || github.ref_name }}
            ghcr.io/${{ github.repository_owner }}/noodle-gallery-server:latest
          build-args: |
            DEVICE=cpu
            BUILD_ID=${{ github.run_id }}
            BUILD_SOURCE_REF=${{ github.ref_name }}
            BUILD_SOURCE_COMMIT=${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  build-ml:
    name: Build & Push ML (${{ matrix.device }})
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - device: cpu
            suffix: ''
          - device: cuda
            suffix: '-cuda'
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2 # v3.10.0

      - name: Login to GHCR
        uses: docker/login-action@74a5d142397b4f367a81961eba4e8cd7edddf772 # v3.4.0
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@263435318d21b8e681c14492fe198e362a7d2c83 # v6.18.0
        with:
          context: machine-learning
          file: machine-learning/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/noodle-gallery-ml:${{ inputs.version || github.ref_name }}${{ matrix.suffix }}
            ghcr.io/${{ github.repository_owner }}/noodle-gallery-ml:latest${{ matrix.suffix }}
          build-args: |
            DEVICE=${{ matrix.device }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Step 2: Verify YAML is valid**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/docker.yml'))"`
Expected: No output (valid YAML)

**Step 3: Commit**

```bash
git add .github/workflows/docker.yml
git commit -m "ci: replace Docker workflow with self-contained GHCR publishing"
```

---

### Task 2: Update docker-compose.yml to reference fork images

**Files:**

- Modify: `docker/docker-compose.yml`

**Step 1: Update image references**

Change the server image from:

```yaml
image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
```

to:

```yaml
image: ghcr.io/open-noodle/noodle-gallery-server:${IMMICH_VERSION:-latest}
```

Change the ML image from:

```yaml
image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}
```

to:

```yaml
image: ghcr.io/open-noodle/noodle-gallery-ml:${IMMICH_VERSION:-latest}
```

**Step 2: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "ci: point docker-compose at fork GHCR images"
```

---

### Task 3: Re-enable the workflow and test

**Step 1: Push the branch**

```bash
git push origin HEAD
```

**Step 2: Re-enable the Docker workflow**

```bash
gh workflow enable docker.yml
```

**Step 3: Trigger a test build**

```bash
gh workflow run docker.yml --ref <current-branch> -f version=v0.0.0-test.1
```

**Step 4: Watch the run**

```bash
gh run list --workflow=docker.yml --limit 1
gh run watch <run-id>
```

Expected: All jobs pass, images appear at `ghcr.io/open-noodle/noodle-gallery-server:v0.0.0-test.1` and `ghcr.io/open-noodle/noodle-gallery-ml:v0.0.0-test.1`.

**Step 5: Verify images exist**

```bash
gh api user/packages/container/noodle-gallery-server/versions --jq '.[0].metadata.container.tags'
gh api user/packages/container/noodle-gallery-ml/versions --jq '.[0].metadata.container.tags'
```

**Step 6: Clean up test images (optional)**

Delete the test versions from GHCR if desired:

```bash
gh api -X DELETE user/packages/container/noodle-gallery-server/versions/<version-id>
gh api -X DELETE user/packages/container/noodle-gallery-ml/versions/<version-id>
```
