# Upstream Rebase Hardening Phase 1: Baseline And Coverage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task. Use TDD: write the failing test first,
> implement the smallest passing change, then refactor.

**Goal:** Make manifest baseline validation ancestor-aware and warn when new
fork work is covered only by broad optional manifest globs.

**Design Source:**
`docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`

**Depends On:** existing upstream rebase process tooling from PR #516.

---

## Scope

This phase updates coverage behavior only. It should not change batch planning,
readiness, checkpointing, or fork-surface reporting.

## Task 1: Add Git State Helpers

**Files:**

- Modify: `tools/upstream-preflight/src/git.ts`
- Modify: `tools/upstream-preflight/src/git.spec.ts`

- [x] **Step 1: Write failing tests**

In `git.spec.ts`, use the existing temporary repository fixture to cover:

- `isAncestor(repo, base, head)` returns `true` for an ancestor commit
- `isAncestor(repo, sibling, head)` returns `false` for a non-ancestor commit
- `revParse(repo, 'HEAD')` returns a full 40-character SHA
- `listChangedFiles(repo, '<base>..<head>')` returns sorted changed files
- missing or invalid refs produce a clear thrown error from the Git helper

- [x] **Step 2: Implement helpers**

Add helpers in `tools/upstream-preflight/src/git.ts`:

```ts
export function isAncestor(cwd: string, ancestor: string, descendant: string): boolean;
export function listChangedFiles(cwd: string, range: string): string[];
export function revParse(cwd: string, ref: string): string;
```

Use `git merge-base --is-ancestor` for ancestry and preserve the current
`runGit` error behavior for invalid refs.

- [x] **Step 3: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- git.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: the new Git helper tests and type check pass.

## Task 2: Make Manifest Baseline Ancestor-Aware

**Files:**

- Modify: `tools/upstream-preflight/src/coverage.ts`
- Modify: `tools/upstream-preflight/src/coverage.spec.ts`
- Modify: `Makefile`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Write failing tests**

Add coverage tests for:

- exact baseline match returns `ok: true` with no warnings
- baseline ancestor of expected head returns `ok: true` with a warning and
  sorted changed-since-baseline files
- baseline not ancestor of expected head returns `ok: false` with an error
- manifest baseline commit missing from the local repository returns `ok: false`
  with a clear error
- expected head missing from the local repository returns `ok: false` with a
  clear error
- missing expected head preserves current non-validating behavior for direct
  unit tests that do not run inside a Git repository
- the changed-since-baseline list comes from a real Git fixture, not a mocked
  string list

- [x] **Step 2: Introduce structured validation**

Change `validateManifestForkHead` to return:

```ts
type ManifestHeadValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  changedSinceBaseline: string[];
};
```

The function should accept enough context to run Git ancestry checks, for
example:

```ts
validateManifestForkHead(manifest, {
  repoPath,
  expectedHead,
});
```

Keep CLI behavior clear:

- print errors before warnings
- set a non-zero exit code only for errors or uncovered files
- print warnings for ancestor baseline drift without failing
- distinguish non-ancestor history errors from missing-ref/misconfigured-clone
  errors in output so operators know whether to fetch refs or reconcile the
  manifest

- [x] **Step 3: Keep full fork delta coverage**

First add a failing coverage test where:

- the full fork file list contains an old uncovered file and a new covered file
- the changed-since-baseline list contains only the new covered file
- coverage still fails because the old uncovered file is in the full fork delta

Keep `make fork-ownership-coverage-check` using the full fork delta:

```bash
git diff --name-only upstream/main...origin/main
```

Do not narrow coverage to changed-since-baseline files. The changed file list is
only for warning and manifest maintenance output.

- [x] **Step 4: Update docs**

Update the Manifest Baseline section in
`docs/docs/developer/upstream-rebase-process.md`:

- `last_verified_fork_head` is a reviewed floor
- exact match is current
- ancestor baseline passes with warnings
- non-ancestor baseline fails
- full fork delta coverage still runs every time

- [x] **Step 5: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- git.spec.ts coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make fork-ownership-coverage-check
```

Expected: tests and type check pass. On the current branch, coverage passes if
the manifest baseline is an ancestor of `origin/main`, and prints the files that
changed after the baseline.

## Task 3: Classify Explicit Versus Broad Optional Coverage

**Files:**

- Modify: `tools/upstream-preflight/src/coverage.ts`
- Modify: `tools/upstream-preflight/src/coverage.spec.ts`
- Modify: `tools/upstream-preflight/src/types.ts`

- [x] **Step 1: Write failing tests**

Add tests for:

- explicit-only coverage
- broad optional-only coverage
- files covered by both explicit and broad optional entries
- uncovered files
- narrow optional paths are covered without producing broad coverage warnings
- broad optional warnings scoped only to files changed after the manifest
  baseline
- old broad optional-only files do not warn when they were not changed after the
  manifest baseline

- [x] **Step 2: Implement coverage classification**

Add helpers that identify whether a file is covered by:

- explicit manifest entries
- broad optional manifest entries
- both
- neither

Treat these as explicit coverage sources:

- `owned_paths`
- `upstream_extension_paths`
- `expected_symbols`
- `generated_artifacts`
- database migration entries
- mobile paths
- CI invariant paths
- package patch metadata

Treat `optional_paths` entries that match whole trees as broad optional
coverage, for example `mobile/**`, `server/src/**`, `docs/**`, `.github/**`, or
`web/src/routes/**`.

Treat narrower `optional_paths` entries as normal coverage rather than broad
optional coverage. Examples include a single file path, an extension-specific
glob, or a constrained subdirectory glob such as
`server/test/medium/storage-migration*.spec.ts`. These should prevent uncovered
file failures but should not emit broad coverage warnings.

- [x] **Step 3: Emit broad coverage warnings**

Emit warnings only when a post-baseline file is covered by broad optional globs
and no explicit entries.

Warnings should include the file path, the matching broad glob, and a suggestion
to add a narrower owned path or upstream extension path.

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make fork-ownership-coverage-check
```

Expected: normal coverage passes with warnings when only broad optional coverage
warnings exist.

## Task 4: Add Strict Broad Coverage Mode

**Files:**

- Modify: `tools/upstream-preflight/src/coverage.ts`
- Modify: `tools/upstream-preflight/src/coverage.spec.ts`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Write failing CLI tests**

Add tests for:

- normal mode exits 0 when only broad coverage warnings exist
- `--strict-broad-coverage` exits non-zero for broad coverage warnings
- `--strict-broad-coverage` exits 0 when all post-baseline files have explicit
  or narrow optional coverage
- strict mode still reports uncovered files and baseline errors distinctly

- [x] **Step 2: Add CLI flag**

Add:

```bash
--strict-broad-coverage
```

Default behavior: broad coverage warnings do not fail the command.

Strict behavior: broad coverage warnings set a non-zero exit code. This is for
manifest cleanup, not for the normal upstream rebase readiness path.

- [x] **Step 3: Update docs**

Document normal mode and strict mode in
`docs/docs/developer/upstream-rebase-process.md`.

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make fork-ownership-coverage-check
```

Then run strict mode against two explicit fixture cases:

```bash
pnpm --filter @gallery/upstream-preflight run coverage -- /tmp/gallery-fork-files-strict-pass.txt docs/fork/ownership.yml --expected-head "$(git rev-parse origin/main)" --strict-broad-coverage
! pnpm --filter @gallery/upstream-preflight run coverage -- /tmp/gallery-fork-files-strict-fail.txt docs/fork/ownership.yml --expected-head "$(git rev-parse origin/main)" --strict-broad-coverage
```

Expected: normal coverage passes with warnings. Strict mode passes when all
post-baseline files have explicit or narrow optional coverage, and fails only
when post-baseline files are covered solely by broad optional globs.

## Final Verification

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- git.spec.ts coverage.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make fork-ownership-coverage-check
pnpm --filter @gallery/upstream-preflight run format
```

Expected:

- tests, type check, and format pass
- `make fork-ownership-coverage-check` no longer fails solely because
  `origin/main` advanced past the manifest baseline
- full fork coverage still catches uncovered files
- broad coverage warnings are non-blocking by default
