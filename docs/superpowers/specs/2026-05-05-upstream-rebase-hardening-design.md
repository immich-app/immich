# Upstream Rebase Hardening Design

Status: implemented on `plan/upstream-rebase-process`
Date: 2026-05-05
Worktree: `/home/pierre/dev/gallery/.claude/worktrees/upstream-rebase-process`
Branch: `plan/upstream-rebase-process`

## Problem

The first upstream rebase process now has the right foundation: fork ownership
is versioned in `docs/fork/ownership.yml`, upstream work is planned in
risk-aware batches, and post-batch audits check the areas that are most likely
to drift silently.

That is enough to start an upstream sync carefully, but the first live use
surfaced several operator issues:

- `metadata.last_verified_fork_head` is treated as an exact match with
  `origin/main`, so any new fork commit blocks the process even when the
  manifest still covers the fork surface.
- The batch planner correctly creates small conflict-resolution batches, but
  the rendered commands imply heavy stabilization work after every small batch.
- Operators can lose track of the current batch after conflict resolution or
  after switching machines.
- Broad manifest globs such as `mobile/**` and `docs/**` are useful as safety
  nets, but they can hide newly-added fork work that should have explicit
  ownership.
- The fork still keeps much of its behavior inside upstream-owned directories,
  which increases conflict surface on every upstream refactor.

The next phase should harden the process without turning it into a large fork
architecture migration.

## Goals

- Treat the manifest baseline as the last reviewed fork floor, not a strict
  lock to the current fork head.
- Surface fork commits that landed after the manifest baseline, especially when
  their files are covered only by broad optional globs.
- Add a single readiness command that tells an operator whether the upstream
  sync can start and where the reports were written.
- Persist batch plan provenance so stale plans are rejected when `upstream/main`
  moves.
- Add a `next-batch` command that identifies the next upstream batch from the
  current worktree state.
- Separate cheap per-batch checks from heavier stabilization checkpoints.
- Establish a low-friction `gallery/*` namespace convention for new or touched
  fork code, and report migration candidates without requiring a bulk move.

## Non-Goals

- Do not migrate the whole fork into `gallery/*` directories in this phase.
- Do not remove human review from conflict resolution, generated artifacts, or
  Drift migration renumbering.
- Do not make upstream rebase tooling block normal development PRs.
- Do not force every upstream batch to contain exactly ten commits.
- Do not automatically force-push `origin/main`.

## Implementation Discipline

Implementation should use test-driven development. Each behavior change should
start with a failing focused test, then the smallest implementation that makes
it pass, then refactoring once the behavior is protected.

Do not batch several untested behaviors into one large implementation step. The
tooling is rebase safety infrastructure, so tests should cover error paths and
operator recovery cases, not only happy paths.

## Design

### Manifest Baseline Semantics

`metadata.last_verified_fork_head` should mean:

> The ownership manifest was reconciled against this fork commit.

The coverage check should compare that commit with the current fork head:

- If `last_verified_fork_head == origin/main`, the manifest is current.
- If `last_verified_fork_head` is an ancestor of `origin/main`, the check passes
  but prints a warning with the files changed since the baseline.
- If `last_verified_fork_head` is not an ancestor of `origin/main`, the check
  fails because the manifest baseline does not describe the current branch
  history.

Coverage should still be evaluated against the full fork delta:

```bash
git diff --name-only upstream/main...origin/main
```

The changed-since-baseline list is only a review aid. It should not replace full
fork coverage.

### Broad Coverage Warnings

The manifest currently uses broad optional paths as safety nets. That is useful
because the initial manifest must cover a large fork delta, but new fork work
should become more explicit over time.

The coverage check should classify coverage into two groups:

- explicit coverage: `owned_paths`, `upstream_extension_paths`,
  `expected_symbols`, `generated_artifacts`, database migration entries, mobile
  paths, CI invariant paths, and patch metadata
- broad optional coverage: `optional_paths` entries that cover entire trees, for
  example `mobile/**`, `server/src/**`, `docs/**`, or `.github/**`

Files changed after `last_verified_fork_head` that are covered only by broad
optional globs should produce warnings. The first version should keep those
warnings non-blocking, with an optional strict mode for manifest maintenance.

Example warning:

```text
Ownership manifest broad coverage warning:
- mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/1024.png is covered only by mobile/**
  Consider adding a narrower owned path under mobile-app-and-branding.
```

### Readiness Command

Add:

```bash
make upstream-rebase-ready
```

This target should run the checks that are safe before rebase work starts:

- manifest coverage, including ancestor-aware baseline validation
- upstream preflight
- batch plan generation
- unbatched post-rebase audit signals, treated as planning signals
- CI invariant check
- package patch check

The command should write both Markdown and JSON summaries under:

```bash
$(git rev-parse --git-path upstream-preflight)
```

Exit policy:

- fail for uncovered fork files, non-ancestor manifest baselines, stale refs, CI
  invariant failures, and patch metadata failures
- pass with warnings for ancestor baseline drift and broad optional coverage
- report known planning issues such as mobile Drift collisions and generated
  artifacts as "planned resolution required" instead of hiding them

The operator should be able to run one command and know whether the rebase can
start.

### Batch Plan Provenance

Batch plans should be written to Git metadata, not only printed to stdout:

```text
$(git rev-parse --git-path upstream-preflight)/batch-plan.md
$(git rev-parse --git-path upstream-preflight)/batch-plan.json
```

The JSON should include:

```ts
type BatchPlanMetadata = {
  generatedAt: string;
  mergeBase: string;
  upstreamRef: string;
  upstreamHead: string;
  forkRef: string;
  forkHead: string;
  manifestForkBaseline: string;
  softCap: number;
};
```

Batch JSON must store full upstream commit SHAs for batch tips and commit
entries. Markdown may render short SHAs for readability, but commands and
ancestor checks should use full SHAs.

Commands that consume a batch plan should verify that the current
`upstream/main` still matches `metadata.upstreamHead`. If it does not, the tool
should ask the operator to rerun `make upstream-batch-plan` before continuing.

### Next Batch Detection

Add:

```bash
make upstream-next-batch
```

The command should read the persisted batch plan and inspect the current
worktree:

- `git merge-base HEAD upstream/main` identifies the upstream base currently
  contained in the branch.
- the last batch whose tip is an ancestor of `HEAD` is considered complete.
- the next batch is the first persisted batch after that complete batch.
- if `upstream/main` is already an ancestor of `HEAD`, the rebase has reached
  the current upstream head.

The output should include the next batch id, tip SHA, risk, reasons, and exact
commands. This reduces the chance of accidentally skipping or replaying a batch.

### Checkpoints Versus Batches

Keep the small batch plan, but stop treating every small batch as a full
stabilization point.

Definitions:

- Batch: the smallest upstream unit used for conflict resolution and
  batch-scoped audits.
- Checkpoint: a stabilization point where heavier checks and optional remote CI
  are worth running.

Cheap checks should run after every affected batch:

- `make upstream-postrebase-audit BATCH=NN`
- `make mobile-drift-rebase-check BATCH=NN` when required
- `make ci-invariants-check` when workflows or CI-sensitive areas are touched
- `make fork-patches-check` when dependency or patch-sensitive areas are touched

Expensive checks should run at checkpoints:

- `make e2e-rebase-smoke`
- `make storage-migration-tests`
- `make storage-migration-e2e`
- remote CI on `rebase/upstream-batch-NN`

The planner should mark checkpoints using a conservative first policy:

- every high-risk batch is a checkpoint
- any low/medium sequence becomes a checkpoint after roughly ten cumulative
  upstream commits
- the final batch is always a checkpoint

The manifest can support this by adding optional check metadata:

```yaml
checks:
  e2e-rebase-smoke:
    command: make e2e-rebase-smoke
    phase: post-batch
    cost: expensive
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
    cost: cheap
```

Unknown check cost should default to `expensive` so new checks are not silently
under-run.

### Gallery Namespace Convention

Future fork work should move toward fork-owned namespaces when practical:

- server: `server/src/gallery/**`
- web: `web/src/lib/gallery/**`
- mobile: `mobile/lib/gallery/**`
- database: `server/src/schema/migrations-gallery/**`
- CI/actions: `.github/actions/gallery-*/**` and `.github/workflows/gallery-*.yml`

This is a convention for new and touched fork work, not an immediate migration
requirement.

Preferred shape:

1. Put fork-owned behavior in a Gallery namespace.
2. Keep upstream-owned files as small adapters or hook points.
3. Track those hook points in `upstream_extension_paths`.
4. Track Gallery-owned code in `owned_paths`.

The preflight report should add a fork-surface section:

- count of fork delta files under preferred Gallery namespaces
- count of fork delta files outside those namespaces
- direct-overlap files that are good candidates for extraction into
  `gallery/*`
- changed-since-baseline files covered only by broad optional globs

This gives the team a steady path to reduce conflict surface without delaying
the upcoming upstream rebase.

## Test Strategy

The implementation plan must include focused Vitest coverage for these cases:

- manifest baseline validation passes on exact match, passes with warnings when
  the baseline is an ancestor of `origin/main`, and fails when the baseline is
  not an ancestor
- coverage still checks the full fork delta even when only a small set of files
  changed since the manifest baseline
- broad optional coverage warnings are emitted only for post-baseline files that
  have no explicit manifest coverage
- strict broad coverage mode fails on broad-only warnings, while normal coverage
  mode passes with warnings
- batch plan JSON includes full commit SHAs and provenance metadata
- stale persisted batch plans fail clearly when `upstream/main` moved
- no-incoming-upstream state renders an empty batch plan and a passing readiness
  summary
- `upstream-next-batch` handles no plan, stale plan, pre-rebase state, partially
  completed batches, and fully completed upstream state
- readiness fails on true blockers, passes with warnings for reviewed-baseline
  drift, and reports known Drift/generated-artifact work as planned resolutions
- checkpoint rendering separates cheap batch checks from expensive checkpoint
  checks, defaults unknown check cost to expensive, and always checkpoints the
  final batch
- fork-surface reporting counts preferred namespace files, outside-namespace
  files, direct-overlap extraction candidates, and broad-only recent files
- CLI commands set exit codes consistently for blockers versus warnings
- generated reports stay under `$(git rev-parse --git-path
upstream-preflight)` and do not dirty the working tree

## Rollout

1. Implement ancestor-aware manifest coverage and broad coverage warnings.
2. Persist batch plan metadata and add stale-plan validation.
3. Add `upstream-next-batch`.
4. Add `upstream-rebase-ready`.
5. Split planner output into batch checks and checkpoint checks.
6. Document Gallery namespace conventions and add fork-surface reporting.
7. Update the local `rebase-upstream-report` skill after the repo tooling lands.

## Success Criteria

- `make fork-ownership-coverage-check` passes when
  `last_verified_fork_head` is an ancestor of `origin/main`, while still
  warning about fork commits that landed after the baseline.
- `make upstream-rebase-ready` gives a clear pass/fail readiness summary for
  the upcoming upstream rebase.
- `make upstream-batch-plan` writes a reusable plan with upstream/fork
  provenance.
- `make upstream-next-batch` can recover the next command from a partially
  completed rebase worktree.
- Heavy checks are rendered at checkpoints, while cheap checks remain
  batch-scoped.
- The docs explain the `gallery/*` namespace convention without requiring a
  disruptive migration.
