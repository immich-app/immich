# Upstream Rebase Hardening Phase 3: Readiness And Checkpoints

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task. Use TDD: write the failing test first,
> implement the smallest passing change, then refactor.

**Goal:** Add a one-command upstream rebase readiness summary and split batch
commands into cheap per-batch checks and expensive checkpoint checks.

**Design Source:**
`docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`

**Depends On:** Phase 1 coverage hardening and Phase 2 persisted batch plans.

---

## Scope

This phase adds readiness and checkpoint-aware rendering. It should not add
fork-surface reporting or update the local skill; those are Phase 4.

## Task 1: Add Readiness Model

**Files:**

- Create: `tools/upstream-preflight/src/ready.ts`
- Create: `tools/upstream-preflight/src/ready.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Write failing tests**

Add readiness tests for:

- uncovered fork files cause `ok: false`
- non-ancestor manifest baseline causes `ok: false`
- CI invariant failures cause `ok: false`
- package patch failures cause `ok: false`
- current-fork post-rebase audit failures, such as missing fork-owned files,
  missing expected symbols, or missing expected Gallery migrations, cause
  `ok: false`
- warning-only states cause `ok: true`
- ancestor baseline drift is reported as a warning
- broad optional coverage is reported as a warning
- mobile Drift collisions are reported as planned resolutions
- generated artifact and migration-collision audit signals are reported as
  planned resolutions
- an existing stale `batch-plan.json` does not block readiness when readiness is
  generating and writing a fresh batch plan
- batch plan generation failures are reported as blockers
- report paths are included in the result
- no-incoming-upstream state passes with a useful summary
- CLI exit code is zero for warning-only readiness and non-zero for blockers

- [x] **Step 2: Implement model**

Create:

```ts
type ReadinessResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  plannedResolutions: string[];
  reportPaths: string[];
};
```

Errors should include:

- uncovered fork files
- non-ancestor manifest baseline
- stale or missing refs needed to compute a fresh plan
- failures while generating or validating the fresh batch plan that readiness
  writes
- CI invariant failures
- package patch failures

Warnings should include:

- ancestor baseline drift
- broad optional coverage

Planned resolutions should include known upstream rebase work:

- mobile Drift collisions
- generated artifacts
- migration collisions

Collect generated artifact and migration-collision planning signals by calling
the existing post-rebase audit logic in unbatched/report mode. Do not treat
expected current-backlog signals as readiness failures.

Classify post-rebase audit results carefully:

- current-fork integrity checks, such as fork-owned file survival, extension
  symbol survival, Gallery migration count, expected Gallery migration
  filenames, and migration glob coverage, are blockers when they fail before the
  rebase starts
- upstream-range planning checks, such as generated artifact review and upstream
  migration timestamp collisions, are planned resolutions when they fail because
  incoming upstream commits touch those areas

- [x] **Step 3: Render reports**

Add Markdown and JSON render/write helpers for:

```text
$(git rev-parse --git-path upstream-preflight)/readiness.md
$(git rev-parse --git-path upstream-preflight)/readiness.json
```

Generated reports must not dirty source status.
Add `--output-dir <path>` support for readiness report tests; the default must
remain `$(git rev-parse --git-path upstream-preflight)`.

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- ready.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: readiness behavior is covered before the CLI is wired.

## Task 2: Add CLI And Make Target

**Files:**

- Modify: `tools/upstream-preflight/package.json`
- Modify: `tools/upstream-preflight/src/index.ts`
- Modify: `Makefile`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Add failing CLI smoke test or direct command test**

Add a test that proves the ready command sets exit code semantics correctly for
blockers versus warning-only states.

- [x] **Step 2: Add commands**

Add:

```bash
pnpm --filter @gallery/upstream-preflight run ready
make upstream-rebase-ready
```

The command should run the safe pre-rebase checks:

- manifest coverage
- upstream preflight
- batch plan generation
- unbatched post-rebase audit signals as planning signals
- CI invariant check
- package patch check

The command should write fresh preflight, batch plan, and readiness outputs in
the same output directory. It should overwrite an older stale `batch-plan.json`
instead of treating that old file as a blocker. Stale-plan validation still
applies to commands that consume an existing persisted plan, such as
`upstream-next-batch`.

- [x] **Step 3: Update docs**

Update `docs/docs/developer/upstream-rebase-process.md` so the operator flow
starts with:

```bash
make upstream-rebase-ready
```

- [x] **Step 4: Verify current-backlog behavior**

Run:

```bash
make upstream-rebase-ready
test -f "$(git rev-parse --git-path upstream-preflight)/readiness.json"
git status --short
```

Expected: readiness passes when only known planning issues remain. It names
mobile Drift collisions and generated artifacts as planned resolutions, not as
hidden failures. Source status is not dirtied by generated reports.

## Task 3: Add Check Cost Metadata

**Files:**

- Modify: `docs/fork/ownership.yml`
- Modify: `tools/upstream-preflight/src/types.ts`
- Modify: `tools/upstream-preflight/src/manifest.ts`
- Modify: `tools/upstream-preflight/src/manifest.spec.ts`

- [x] **Step 1: Write failing tests**

Add manifest tests for:

- explicit `cheap`
- explicit `expensive`
- missing cost defaults to `expensive`
- required check id without a manifest `checks` entry defaults to expensive and
  renders with a `make <check-id>` fallback command
- invalid cost is rejected with a clear manifest validation error

- [x] **Step 2: Extend manifest schema**

Add optional `cost` metadata to manifest checks:

```yaml
checks:
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
    cost: cheap
  e2e-rebase-smoke:
    command: make e2e-rebase-smoke
    phase: post-batch
    cost: expensive
```

Unknown or omitted cost should default to `expensive`.
Invalid cost strings in manifest YAML should fail manifest validation. Required
checks that are not present in `checks` should remain supported for backward
compatibility, default to expensive, and render with `make <check-id>`.

Set the initial manifest costs conservatively:

- `mobile-drift-rebase-check`, `ci-invariants-check`, and `fork-patches-check`
  are cheap
- `e2e-rebase-smoke`, `storage-migration-tests`, and `storage-migration-e2e`
  are expensive

- [x] **Step 3: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- manifest.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: check metadata parsing is covered and type-safe.

## Task 4: Split Batch Checks From Checkpoint Checks

**Files:**

- Modify: `tools/upstream-preflight/src/types.ts`
- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Write failing tests**

Add batch tests for:

- cheap checks render after every affected batch
- expensive checks render only at checkpoints
- mobile Drift keeps its `BATCH=NN` argument
- rendered check commands use `checks.<id>.command` from the manifest when
  available
- missing manifest check entries fall back to `make <check-id>`
- high-risk batches are checkpoints
- low/medium sequences checkpoint after roughly ten cumulative upstream commits
- low/medium cumulative checkpointing resets after a high-risk checkpoint
- final batch is always a checkpoint
- unknown check cost is treated as expensive
- remote push commands render only at checkpoints
- `upstream-next-batch` output uses the same checkpoint-aware command rendering
  as `upstream-batch-plan`

- [x] **Step 2: Extend batch output**

Extend batch output with:

```ts
postBatchChecks: string[];
checkpointChecks: string[];
checkpoint: boolean;
```

Keep `requiredChecks` if existing callers still use it, but render commands from
the split check groups.
Use manifest check commands when available. For the mobile Drift check, render a
batch-scoped command even when the manifest command is unscoped:

```bash
make mobile-drift-rebase-check BATCH=NN
```

- [x] **Step 3: Implement checkpoint policy**

Use this first policy:

- high-risk batches are checkpoints
- low/medium sequences become checkpoints after roughly ten cumulative upstream
  commits since the previous checkpoint
- the final batch is always a checkpoint

After a checkpoint, reset the low/medium cumulative commit counter so the next
low/medium sequence gets its own roughly-ten-commit checkpoint window.

- [x] **Step 4: Render clearer commands**

Update `renderBatchMarkdown` so each batch shows:

- rebase command
- post-batch audit
- cheap batch checks
- checkpoint checks only when the batch is a checkpoint
- remote push command only when the batch is a checkpoint

- [x] **Step 5: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- manifest.spec.ts batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-batch-plan
```

Expected: batch output still preserves upstream order, but expensive checks and
remote pushes appear only at checkpoints.

## Final Verification

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- ready.spec.ts manifest.spec.ts batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-rebase-ready
make upstream-batch-plan
make upstream-next-batch
pnpm --filter @gallery/upstream-preflight run format
```

Expected:

- readiness passes with expected warnings and planned-resolution items
- readiness writes Markdown and JSON under Git metadata
- batch plan separates cheap batch checks from checkpoint checks
- expensive checks and remote pushes appear only at checkpoints
