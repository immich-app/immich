# Upstream Rebase Hardening Plan Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement each phase plan task-by-task. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Harden the manifest-driven upstream rebase process so it is easier to
start, resume, and checkpoint during the upcoming upstream sync.

**Architecture:** The hardening work is split into smaller phase plans. Each
phase leaves the tooling in a working state and expands the rebase process
without changing `origin/main`.

**Tech Stack:** TypeScript, commander, yaml, micromatch, Vitest, pnpm workspace,
Makefile, Markdown.

**Design Source:**
`docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`

---

## Phase Files

Execute the phase plans in this order:

1. `docs/superpowers/plans/2026-05-05-upstream-rebase-hardening-01-baseline-coverage.md`
2. `docs/superpowers/plans/2026-05-05-upstream-rebase-hardening-02-batch-navigation.md`
3. `docs/superpowers/plans/2026-05-05-upstream-rebase-hardening-03-readiness-checkpoints.md`
4. `docs/superpowers/plans/2026-05-05-upstream-rebase-hardening-04-fork-surface-rollout.md`

## Shared Rules

- Work in `/home/pierre/dev/gallery/.claude/worktrees/upstream-rebase-process`
  on branch `plan/upstream-rebase-process`.
- Do not update `main` from this worktree.
- Do not force-push `origin/main`.
- Keep generated reports under `$(git rev-parse --git-path upstream-preflight)`.
- Do not bulk-migrate fork code into `gallery/*` namespaces in this plan.
- Keep broad coverage warnings non-blocking unless a command explicitly asks for
  strict mode.
- Use TDD for implementation: write or update a focused failing test first, make
  the smallest implementation change that passes it, then refactor behind the
  passing test.
- Keep tests behavior-focused. Prefer small unit tests for parsing and planning,
  temporary Git repositories for Git-state behavior, and Make/CLI smoke checks
  only after the unit behavior is covered.
- Keep phase commits separate unless the user asks for a single combined commit.

## Required Test Coverage

Implementation is not complete until the phase plans cover these cases:

- manifest baseline exact match, ancestor-with-warning, non-ancestor failure,
  and missing expected head behavior
- changed-since-baseline file listing from a real Git fixture
- coverage over the full fork delta, even when only one post-baseline file
  changed
- explicit coverage, broad optional coverage, both explicit-plus-broad coverage,
  uncovered files, strict broad coverage failure, and normal broad coverage
  warning-only behavior
- persisted batch plan metadata, full commit SHA persistence, Markdown short SHA
  readability, stale upstream head rejection, missing plan failure, and corrupt
  plan failure
- no-incoming-upstream behavior for batch planning, readiness, and next-batch
- `upstream-next-batch` before any batch, after a middle batch, after the final
  batch, and when `upstream/main` is already contained in `HEAD`
- readiness blocker failures, warning-only success, planned mobile Drift
  collision reporting, planned generated-artifact reporting, and report path
  emission
- CLI exit codes for blockers, warning-only states, stale plans, and completed
  upstream state
- checkpoint policy for high-risk batches, low/medium cumulative checkpoints,
  final-batch checkpointing, cheap versus expensive checks, and unknown check
  cost defaulting to expensive
- fork-surface counts for preferred namespaces, outside namespaces, direct
  overlap extraction candidates, and broad-only post-baseline files
- generated report writes under Git metadata without dirtying `git status`

## Phase Boundaries

Phase 1 fixes the immediate blocker: `last_verified_fork_head` should be a
reviewed floor, not an exact lock to `origin/main`. It also adds broad coverage
warnings.

Phase 2 makes batch plans resumable by persisting provenance and adding
`upstream-next-batch`.

Phase 3 adds the one-command readiness summary and changes batch output to use
cheap per-batch checks plus heavier checkpoint checks.

Phase 4 adds fork-surface reporting, documents the `gallery/*` namespace
convention, and updates the local upstream rebase skill.

## Task 0: Baseline Review

**Files:**

- Read:
  `docs/superpowers/specs/2026-05-04-upstream-rebase-process-design.md`
- Read:
  `docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`
- Read: `tools/upstream-preflight/src/coverage.ts`
- Read: `tools/upstream-preflight/src/batch.ts`
- Read: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Confirm the worktree**

Run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=5
```

Expected: branch is `plan/upstream-rebase-process`, the worktree contains only
intentional planning changes, and the latest commits are from the upstream
rebase process branch.

- [x] **Step 2: Confirm current checks**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
make upstream-batch-plan
```

Expected: tests, type check, and batch planning pass. If
`make fork-ownership-coverage-check` fails only because
`last_verified_fork_head` does not equal the current `origin/main`, Phase 1
handles that.

- [x] **Step 3: Start Phase 1**

Open:

```bash
sed -n '1,260p' docs/superpowers/plans/2026-05-05-upstream-rebase-hardening-01-baseline-coverage.md
```

Expected: the phase begins with TDD for Git ancestry helpers and manifest
baseline validation.
