# Upstream Rebase Hardening Phase 4: Fork Surface And Rollout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task. Use TDD: write the failing test first,
> implement the smallest passing change, then refactor.

**Goal:** Add fork-surface reduction signals, document the `gallery/*`
namespace convention, and update the operator flow and local upstream rebase
skill.

**Design Source:**
`docs/superpowers/specs/2026-05-05-upstream-rebase-hardening-design.md`

**Depends On:** Phases 1 through 3.

---

## Scope

This phase does not bulk-migrate existing fork code. It adds reporting and docs
so new and touched fork work can gradually move toward Gallery-owned
namespaces.

## Task 1: Add Fork Surface Manifest Metadata

**Files:**

- Modify: `docs/fork/ownership.yml`
- Modify: `tools/upstream-preflight/src/types.ts`
- Modify: `tools/upstream-preflight/src/manifest.ts`
- Modify: `tools/upstream-preflight/src/manifest.spec.ts`

- [x] **Step 1: Write failing tests**

Add manifest tests for:

- preferred namespaces are parsed by domain
- missing `fork_surface` is allowed for forward compatibility in fixtures
- unknown preferred namespace domains are rejected with clear messages
- blank namespace globs are rejected
- absolute paths and parent-directory traversal are rejected
- invalid namespace entries are rejected with clear messages

- [x] **Step 2: Add manifest section**

Add:

```yaml
fork_surface:
  preferred_namespaces:
    server:
      - server/src/gallery/**
    web:
      - web/src/lib/gallery/**
    mobile:
      - mobile/lib/gallery/**
    database:
      - server/src/schema/migrations-gallery/**
    ci:
      - .github/actions/gallery-*/**
      - .github/workflows/gallery-*.yml
```

- [x] **Step 3: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- manifest.spec.ts
pnpm --filter @gallery/upstream-preflight run check
```

Expected: manifest parsing accepts the new fork surface section.

## Task 2: Report Fork Surface Signals

**Files:**

- Modify: `tools/upstream-preflight/src/signals.ts`
- Modify: `tools/upstream-preflight/src/signals.spec.ts`
- Modify: `tools/upstream-preflight/src/coverage.ts`
- Modify: `tools/upstream-preflight/src/coverage.spec.ts`
- Modify: `tools/upstream-preflight/src/report.ts`
- Modify: `tools/upstream-preflight/src/report.spec.ts`
- Modify: `tools/upstream-preflight/src/index.ts`

- [x] **Step 1: Write failing tests**

Add signal/report tests for:

- fork delta files under preferred Gallery namespaces
- fork delta files outside preferred namespaces
- fork delta files outside preferred namespaces that are known
  `upstream_extension_paths` are reported as adapter/hook files, not as generic
  extraction candidates
- direct-overlap files that are candidates for extraction
- post-baseline files covered only by broad optional globs
- empty fork-surface data renders a useful "none" state
- sample file lists are sorted and capped deterministically
- preflight exit status is unchanged by fork-surface signals
- preflight JSON includes the same fork-surface signal object as Markdown

- [x] **Step 2: Implement signal collection**

Add a signal helper, for example:

```ts
collectForkSurfaceSignals({
  manifest,
  forkFiles,
  overlapFiles,
  broadOnlyRecentFiles,
});
```

Report:

- count and sample files under preferred Gallery namespaces
- count and sample files outside preferred namespaces
- count and sample files outside preferred namespaces that are manifest
  extension adapters
- direct-overlap extraction candidates
- broad-only recent files from Phase 1 coverage classification

Use deterministic sorting and a small sample cap, such as 20 files per group, so
report diffs stay reviewable.

Extraction candidates should be direct-overlap files outside preferred
namespaces that are not already classified as known adapter/hook files. This
keeps the report advisory and avoids implying that every upstream extension path
must be moved.

Reuse the Phase 1 coverage classification helpers to compute
`broadOnlyRecentFiles`. If those helpers are not exported yet, export them from
`coverage.ts` in this task and add direct tests for the exported API.

- [x] **Step 3: Render report section**

Add a fork-surface section to preflight Markdown and JSON. The section should be
advisory, not blocking.

When `fork_surface` is absent, render a stable "not configured" or "none" state
instead of throwing. The real Gallery manifest should include the section, but
fixtures and older branches should keep working.

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test -- signals.spec.ts report.spec.ts
pnpm --filter @gallery/upstream-preflight run check
make upstream-preflight
```

Expected: preflight includes fork-surface signals without changing exit status.

## Task 3: Add Fork Surface Developer Docs

**Files:**

- Create: `docs/docs/developer/fork-surface-guidelines.md`
- Modify: `docs/docs/developer/upstream-rebase-process.md`

- [x] **Step 1: Draft docs**

Create `docs/docs/developer/fork-surface-guidelines.md` with these rules:

- new fork-owned server code should prefer `server/src/gallery/**`
- new fork-owned web code should prefer `web/src/lib/gallery/**`
- new fork-owned mobile code should prefer `mobile/lib/gallery/**`
- database migrations should continue using
  `server/src/schema/migrations-gallery/**`
- upstream-owned files should stay as small adapters or hook points
- do not move code only for namespace purity during an urgent upstream rebase
- when extracting from an upstream-owned file, keep the adapter path in
  `upstream_extension_paths` and the Gallery-owned implementation in
  `owned_paths`
- fork-surface report findings are advisory; they should drive opportunistic
  follow-up work, not block an urgent upstream rebase when the rebase is
  otherwise healthy
- generated artifacts and upstream API clients should not be moved into
  `gallery/*` namespaces

- [x] **Step 2: Link docs**

Link the fork-surface page from
`docs/docs/developer/upstream-rebase-process.md` and mention the preflight
fork-surface section.

- [x] **Step 3: Verify docs**

Run:

```bash
pnpm --filter documentation run format
pnpm --filter documentation run build
```

Expected: documentation formatting and build pass.

## Task 4: Update Operator Flow And Local Skill

**Files:**

- Modify: `docs/docs/developer/upstream-rebase-process.md`
- Modify local skill:
  `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md`

- [x] **Step 1: Update developer docs**

Revise the documented upstream rebase flow:

1. fetch `origin/main` and `upstream/main`
2. run `make upstream-rebase-ready`
3. review `batch-plan.md`
4. use `make upstream-next-batch` before each rebase step
5. run cheap checks after every batch
6. run checkpoint checks and optional remote CI only at checkpoints
7. keep using `push-rebase` before updating `origin/main`

- [x] **Step 2: Update local skill**

Update `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md` so it
delegates readiness and batch navigation to:

```bash
make upstream-rebase-ready
make upstream-next-batch
```

Keep the skill as an orchestrator. Do not move fork inventory back into the
skill.

Make these local-skill changes explicit:

- replace the initial `make upstream-preflight` plus `make upstream-batch-plan`
  sequence with `make upstream-rebase-ready`
- keep review of `batch-plan.md` under
  `$(git rev-parse --git-path upstream-preflight)`
- tell the operator to run `make upstream-next-batch` before each rebase step
- keep `make upstream-postrebase-audit BATCH=NN` after every batch
- keep checkpoint checks and optional remote CI only at checkpoint batches
- keep `make fork-ownership-coverage-check` in final verification
- do not reintroduce fork inventory tables into the skill
- remember that this skill file is outside the repo and should not appear in
  `git status`

- [x] **Step 3: Verify operator flow**

Run:

```bash
pnpm --filter documentation run format
pnpm --filter documentation run build
make upstream-rebase-ready
make upstream-next-batch
```

Expected: docs build, readiness passes with only known planning warnings, and
next-batch output matches the persisted batch plan. The local skill edit does
not appear in repository `git status`.

## Final Verification

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run format
make fork-ownership-coverage-check
make upstream-rebase-ready
make upstream-preflight
make upstream-batch-plan
make upstream-next-batch
make upstream-postrebase-audit BATCH=01
make mobile-drift-rebase-check BATCH=01
make ci-invariants-check
make fork-patches-check
pnpm --filter documentation run format
pnpm --filter documentation run build
```

Expected:

- all package tests, type checks, and formatting checks pass
- coverage passes when the manifest baseline is an ancestor of `origin/main`
- readiness passes with expected warnings and planned-resolution items
- batch plan persists Markdown and JSON
- next-batch prints the next safe operator command
- preflight includes fork-surface signals
- batch-scoped audits remain limited to the requested batch
- documentation builds
