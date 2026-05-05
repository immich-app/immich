# Upstream Rebase Hardening Phase 2: Batch Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task. Use TDD: write the failing test first,
> implement the smallest passing change, then refactor.

**Goal:** Persist batch plan provenance and add `upstream-next-batch` so an
operator can resume a partially completed upstream rebase safely.

**Design Source:**
`docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`

**Depends On:** Phase 1 baseline and coverage hardening.

---

## Scope

This phase changes batch plan persistence and navigation. It should not add
readiness summaries, checkpoint cost splitting, or fork-surface reporting.

## Task 1: Persist Full-SHA Batch Plan Metadata

**Files:**

- Modify: `tools/upstream-preflight/src/types.ts`
- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Write failing tests**

Add batch tests for:

- batch plan metadata includes generated time, merge base, upstream ref,
  upstream head, fork ref, fork head, manifest fork baseline, and soft cap
- generated time is testable without brittle wall-clock assertions, for example
  by injecting a clock or asserting only ISO timestamp shape in render tests
- persisted batch tips use full upstream commit SHAs
- persisted commit entries use full upstream commit SHAs
- Markdown still renders short SHAs for table readability
- generated rebase commands use full SHAs, not short SHAs

- [x] **Step 2: Extend types**

Add:

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

Update `BatchPlan` to include `metadata`.

Change persisted batch tips to full upstream commit SHAs. If the current
`Batch.tipSha` remains the public field, it should become full length. Use a
helper for short display when rendering Markdown.

- [x] **Step 3: Populate metadata in preflight context**

In `tools/upstream-preflight/src/index.ts`, populate metadata from:

- `git merge-base`
- `git rev-parse <upstream-ref>` using the manifest-defined upstream ref
- `git rev-parse <fork-ref>` using the manifest-defined fork ref
- manifest `metadata.last_verified_fork_head`
- current soft cap

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: metadata and full-SHA tests pass.

## Task 2: Write Batch Plan Reports

**Files:**

- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Write failing tests**

Add tests for:

- `batch-plan` writes Markdown to `$(git rev-parse --git-path
upstream-preflight)/batch-plan.md`
- `batch-plan` writes JSON to `$(git rev-parse --git-path
upstream-preflight)/batch-plan.json`
- `batch-plan --output-dir <path>` writes to an explicit test directory without
  requiring tests to inspect the real repository Git metadata path
- output directory creation is idempotent
- generated files live under Git metadata and do not dirty source status

- [x] **Step 2: Implement writers**

Add a writer helper, for example:

```ts
writeBatchPlanReports(plan, outputDir): { markdownPath: string; jsonPath: string };
```

The `batch-plan` command should continue printing Markdown to stdout. It should
also accept `--output-dir <path>` for tests and manual debugging; the default
must remain `$(git rev-parse --git-path upstream-preflight)`.

- [x] **Step 3: Verify**

Run:

```bash
make upstream-batch-plan
test -f "$(git rev-parse --git-path upstream-preflight)/batch-plan.md"
test -f "$(git rev-parse --git-path upstream-preflight)/batch-plan.json"
git status --short
```

Expected: plan files exist under Git metadata and source status is not dirtied
by generated reports.

## Task 3: Reject Missing, Corrupt, Or Stale Plans

**Files:**

- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/git.ts`

- [x] **Step 1: Write failing tests**

Add tests for:

- reading a current persisted plan succeeds
- missing `batch-plan.json` fails with a clear message to run
  `make upstream-batch-plan`
- corrupt JSON fails with a clear parse/validation message
- structurally invalid JSON fails when required metadata, batches, commits, or
  tip SHAs are missing
- batch tips that are not full 40-character SHAs fail validation
- persisted batch tips that are not ancestors of `metadata.upstreamHead` fail
  validation
- stale `metadata.upstreamHead` fails when the current
  `metadata.upstreamRef` target differs
- matching `metadata.upstreamHead` passes

- [x] **Step 2: Implement plan reader and validator**

Add helpers such as:

```ts
readPersistedBatchPlan(repoPath: string, outputDir?: string): BatchPlan;
validatePersistedBatchPlan(plan: BatchPlan, repoPath: string): void;
```

Commands that consume persisted plans should validate them before use.
Validation must use `plan.metadata.upstreamRef`, not a hardcoded
`upstream/main`, so forks with different manifest refs keep working.

- [x] **Step 3: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: missing, corrupt, current, and stale plan cases are covered.

## Task 4: Add `upstream-next-batch`

**Files:**

- Modify: `tools/upstream-preflight/package.json`
- Modify: `tools/upstream-preflight/src/batch.ts`
- Modify: `tools/upstream-preflight/src/batch.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`
- Modify: `Makefile`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Write failing tests**

Add tests for:

- no incoming upstream commits
- pre-rebase branch prints batch 01
- branch whose `HEAD` contains a middle batch tip prints the next batch
- branch whose `HEAD` contains the final batch tip reports completion
- branch where `upstream/main` is already an ancestor of `HEAD` reports
  completion
- stale persisted plan exits non-zero
- missing persisted plan exits non-zero and tells the operator to run
  `make upstream-batch-plan`
- corrupt or structurally invalid persisted plan exits non-zero with a clear
  validation message
- successful completion exits zero and does not print a rebase command

- [x] **Step 2: Implement next-batch selection**

Read and validate `batch-plan.json`, then inspect the current worktree:

- if there are no batches, report that no upstream batches are required
- if `plan.metadata.upstreamRef` is an ancestor of `HEAD`, report completion
- otherwise find the last persisted batch tip that is an ancestor of `HEAD`
- print the next batch id, full tip SHA, risk, reasons, and exact commands

Use full SHAs for commands and ancestry checks. Do not hardcode
`upstream/main`; always use `plan.metadata.upstreamRef` and
`plan.metadata.upstreamHead` from the persisted plan.

- [x] **Step 3: Add CLI script and Make target**

Add:

```bash
pnpm --filter @gallery/upstream-preflight run next-batch
make upstream-next-batch
```

- [x] **Step 4: Update docs**

Update `docs/docs/developer/upstream-rebase-process.md` to tell operators to
run `make upstream-next-batch` before each rebase step.

- [x] **Step 5: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- batch.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-batch-plan
make upstream-next-batch
```

Expected: persisted plan files exist, stale-plan validation works in tests, and
`make upstream-next-batch` prints batch 01 commands from the current pre-rebase
branch.

## Final Verification

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- batch.spec.ts git.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-batch-plan
test -f "$(git rev-parse --git-path upstream-preflight)/batch-plan.json"
make upstream-next-batch
pnpm --filter @gallery/upstream-preflight run format
```

Expected:

- persisted batch plans include provenance and full SHAs
- Markdown remains readable with short SHA display
- missing, corrupt, and stale plans fail clearly
- next-batch can resume from the persisted plan
