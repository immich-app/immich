# E2E CI Speedup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cut ARM e2e CI wall-clock from ~15.5 min to ~8 min via Docker layer caching and parallel Playwright suites.

**Architecture:** Add a `docker-build-e2e` job that builds `immich-server:latest` once per arch with GHA cache and shares it as an artifact. Split `e2e-tests-web` into a `{runner, suite}` matrix so web/ui/maintenance Playwright suites run in parallel.

**Tech Stack:** GitHub Actions, docker/build-push-action, docker/setup-buildx-action, actions/upload-artifact v7, actions/download-artifact v8

**Design doc:** `docs/plans/2026-03-24-e2e-ci-speedup-design.md`

---

### Task 1: Add `docker-build-e2e` job

**Files:**

- Modify: `.github/workflows/test.yml` (insert new job after `server-medium-tests`, before `e2e-tests-server-cli`)

**Step 1: Add the new job**

Insert after line 338 (end of `server-medium-tests`) in `test.yml`:

```yaml
docker-build-e2e:
  name: Build E2E Docker Image (${{ matrix.runner }})
  needs: pre-job
  if: ${{ fromJSON(needs.pre-job.outputs.should_run).e2e == true || fromJSON(needs.pre-job.outputs.should_run).server == true || fromJSON(needs.pre-job.outputs.should_run).cli == true || fromJSON(needs.pre-job.outputs.should_run).web == true }}
  runs-on: ${{ matrix.runner }}
  permissions:
    contents: read
  strategy:
    fail-fast: false
    matrix:
      runner: [ubuntu-latest, ubuntu-24.04-arm]
  steps:
    - name: Checkout code
      uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
      with:
        persist-credentials: false
        submodules: 'recursive'

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2 # v3.10.0

    - name: Build server image
      uses: docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8 # v6.19.2
      with:
        context: .
        file: server/Dockerfile
        build-args: |
          BUILD_ID=1234567890
          BUILD_IMAGE=e2e
          BUILD_SOURCE_REF=e2e
          BUILD_SOURCE_COMMIT=e2eeeeeeeeeeeeeeeeee
        outputs: type=docker,dest=/tmp/immich-server.tar
        tags: immich-server:latest
        cache-from: type=gha,scope=e2e-${{ runner.arch }}
        cache-to: type=gha,scope=e2e-${{ runner.arch }},mode=min

    - name: Upload server image
      uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f # v7.0.0
      with:
        name: e2e-server-image-${{ runner.arch }}
        path: /tmp/immich-server.tar
        retention-days: 1
        if-no-files-found: error
```

**Step 2: Verify YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"`
Expected: No output (valid YAML)

**Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add docker-build-e2e job with GHA layer cache"
```

---

### Task 2: Update `e2e-tests-server-cli` to use pre-built image

**Files:**

- Modify: `.github/workflows/test.yml` — the `e2e-tests-server-cli` job

**Step 1: Update `needs` and replace Docker build step**

Change the job to depend on `docker-build-e2e` (in addition to `pre-job`):

```yaml
e2e-tests-server-cli:
  name: End-to-End Tests (Server & CLI)
  needs: [pre-job, docker-build-e2e]
  if: ${{ fromJSON(needs.pre-job.outputs.should_run).e2e == true || fromJSON(needs.pre-job.outputs.should_run).server == true || fromJSON(needs.pre-job.outputs.should_run).cli == true }}
```

Replace the "Start Docker Compose" step (currently `docker compose up -d --build ...`) with three steps:

```yaml
- name: Download server image
  uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
  with:
    name: e2e-server-image-${{ runner.arch }}
    path: /tmp
- name: Load server image
  run: docker load < /tmp/immich-server.tar
- name: Start Docker Compose
  run: docker compose build e2e-auth-server && docker compose up -d --renew-anon-volumes --force-recreate --remove-orphans --wait --wait-timeout 300
  if: ${{ !cancelled() }}
```

Also upgrade the existing "Archive Docker logs" step's action from v6 to v7:

```yaml
- name: Archive Docker logs
  uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f # v7.0.0
```

**Step 2: Verify YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"`

**Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: use pre-built Docker image in server e2e"
```

---

### Task 3: Split `e2e-tests-web` into parallel suite matrix

**Files:**

- Modify: `.github/workflows/test.yml` — the `e2e-tests-web` job

**Note:** All `actions/upload-artifact` refs in this job are upgraded from v6 (`@b7c566a772e6b6bfb58ed0dc250532a479d7789f`) to v7 (`@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f`) to match the v8 download-artifact used in the image download step.

**Step 1: Update needs, matrix, and collapse suite steps**

Change the job to depend on `docker-build-e2e` and add the suite matrix:

```yaml
e2e-tests-web:
  name: End-to-End Tests (Web - ${{ matrix.suite.name }})
  needs: [pre-job, docker-build-e2e]
  if: ${{ fromJSON(needs.pre-job.outputs.should_run).e2e == true || fromJSON(needs.pre-job.outputs.should_run).web == true }}
  runs-on: ${{ matrix.runner }}
  permissions:
    contents: read
  defaults:
    run:
      working-directory: ./e2e
  strategy:
    matrix:
      runner: [ubuntu-latest, ubuntu-24.04-arm]
      suite:
        - { name: web, cmd: 'pnpm test:web' }
        - { name: ui, cmd: 'pnpm test:web:ui' }
        - { name: maintenance, cmd: 'pnpm test:web:maintenance' }
```

Replace the Docker build step with image download/load (same as Task 2):

```yaml
- name: Download server image
  uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
  with:
    name: e2e-server-image-${{ runner.arch }}
    path: /tmp
- name: Load server image
  run: docker load < /tmp/immich-server.tar
- name: Start Docker Compose
  run: docker compose build e2e-auth-server && docker compose up -d --renew-anon-volumes --force-recreate --remove-orphans --wait --wait-timeout 300
  if: ${{ !cancelled() }}
```

Replace the three sequential test+archive blocks (web, ui, maintenance) with a single pair:

```yaml
- name: Run e2e tests (${{ matrix.suite.name }})
  env:
    PLAYWRIGHT_DISABLE_WEBSERVER: true
  run: ${{ matrix.suite.cmd }}
  if: ${{ !cancelled() }}
- name: Archive test results
  uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f # v7.0.0
  if: success() || failure()
  with:
    name: e2e-${{ matrix.suite.name }}-test-results-${{ matrix.runner }}
    path: e2e/playwright-report/
```

Keep the Docker logs capture and archive steps, updating the artifact name:

```yaml
- name: Capture Docker logs
  if: always()
  run: docker compose logs --no-color > docker-compose-logs.txt
  working-directory: ./e2e
- name: Archive Docker logs
  uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f # v7.0.0
  if: always()
  with:
    name: e2e-${{ matrix.suite.name }}-docker-logs-${{ matrix.runner }}
    path: e2e/docker-compose-logs.txt
```

**Step 2: Verify YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"`

**Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: split Playwright suites into parallel matrix jobs"
```

---

### Task 4: Remove stale `cache_from` from docker-compose.yml

**Files:**

- Modify: `e2e/docker-compose.yml`

**Step 1: Remove the `cache_from` block**

Remove lines 17-24 from `e2e/docker-compose.yml` (the `cache_from` and `args` blocks referencing upstream's registry). These are no longer used since the image is pre-built.

The `build:` key itself can also be removed from the `immich-server` service since downstream jobs load the pre-built image and never run `docker compose build` on it. However, keeping `build:` as a fallback for local `make e2e` usage is useful. Remove only `cache_from` and `args`:

```yaml
immich-server:
  container_name: immich-e2e-server
  image: immich-server:latest
  build:
    context: ../
    dockerfile: server/Dockerfile
```

**Step 2: Commit**

```bash
git add e2e/docker-compose.yml
git commit -m "ci: remove stale upstream cache_from refs in e2e compose"
```

---

### Task 5: Validate full workflow end-to-end

**Step 1: Review the complete workflow file**

Read through the full `.github/workflows/test.yml` and verify:

- `docker-build-e2e` `if:` condition is a superset of both downstream jobs' conditions (server || cli || e2e || web)
- `e2e-tests-server-cli` has `needs: [pre-job, docker-build-e2e]`
- `e2e-tests-web` has `needs: [pre-job, docker-build-e2e]`
- `success-check-e2e` still references `needs: [e2e-tests-server-cli, e2e-tests-web]` (unchanged)
- No `--build` flag remains in any `docker compose up` command in e2e jobs
- Artifact names don't collide (each has unique `${{ matrix.suite.name }}-${{ matrix.runner }}` suffix)

**Step 2: Push branch and verify CI passes**

```bash
git push -u origin ci/e2e-speedup
```

Open the Actions tab and verify:

1. `docker-build-e2e` runs for both runners
2. `e2e-tests-server-cli` waits for build, downloads artifact, runs tests
3. `e2e-tests-web` spawns 6 matrix jobs (3 suites x 2 runners)
4. `success-check-e2e` goes green

**Step 3: Compare timings**

Check ARM web e2e wall-clock time — should be ~8 min vs previous ~15.5 min.
