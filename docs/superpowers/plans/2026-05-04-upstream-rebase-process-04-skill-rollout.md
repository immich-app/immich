# Upstream Rebase Skill Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stale skill-owned fork inventory with repo-owned tooling references and verify the full rebase process.

**Architecture:** Repo tooling stays committed on the implementation branch. The local `rebase-upstream-report` skill is updated separately as an operator workflow file outside the repository.

**Tech Stack:** Markdown, local Codex skill files, Makefile, pnpm, TypeScript, Vitest.

---

## File Structure

- Modify: `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md`
  - Replaces embedded inventory and one-shot rebase flow with manifest-driven batched orchestration.
- Read: `docs/fork/ownership.yml`
  - Skill source of truth for fork feature ownership.
- Read: `tools/upstream-preflight/src/index.ts`
  - CLI command source.
- Read: `Makefile`
  - Operator command source.

### Task 1: Rewrite Local Rebase Skill

**Files:**

- Modify: `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md`

- [x] **Step 1: Back up the current skill file**

Run:

```bash
cp /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md.bak-2026-05-04
test -f /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md.bak-2026-05-04
```

Expected: backup file exists.

- [x] **Step 2: Replace the source-of-truth section**

Edit `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md` so the first major section after the intro is:

````markdown
## Source Of Truth

Fork feature ownership lives in `docs/fork/ownership.yml`.

Before any upstream sync, run:

```bash
make upstream-preflight
make upstream-batch-plan
```

Do not manually reconstruct the fork feature inventory from this skill. If the
manifest is missing a fork feature, update the manifest first.
````

- [x] **Step 3: Replace one-shot rebase flow with batched flow**

Replace the old process section with:

```markdown
## Process

1. Create a fresh worktree from `main`; never reuse a previous upstream rebase worktree.
2. Create a temporary integration branch such as `rebase/upstream-batched`.
3. Fetch `upstream/main`.
4. Run `make upstream-preflight`.
5. Review the generated report with the user before rebasing. Call out high-risk commits, mobile Drift collisions, CI/package patch issues, and broad refactor hints.
6. Run `make upstream-batch-plan`.
7. Review and approve the batch plan with the user.
8. Rebase one recommended batch at a time.
9. For every conflict, record the file, fork side, upstream side, chosen resolution, risk, and verification needed.
10. After each batch, run `make upstream-postrebase-audit BATCH=NN` and the batch's required checks.
11. Push high-risk batches to `rebase/upstream-batch-NN` when remote CI signal is useful.
12. Continue until the final batch reaches `upstream/main`.
13. Run full local and remote CI on the final branch.
14. Back up current `origin/main` before any force push.
15. Force-push `main` only after the final result is green and approved.
```

- [x] **Step 4: Fix the mobile Drift contradiction**

Run:

```bash
rg -n "fork v23/v24 must be renumbered|renumber fork" /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md
```

Replace matching text with:

```markdown
If upstream adds mobile Drift versions that collide with shipped Gallery
versions, keep Gallery's shipped versions unchanged and renumber incoming
upstream migrations above Gallery's current highest version.
```

- [x] **Step 5: Remove stale inventory facts**

Run:

```bash
rg -n "0\\.69\\.0|27 migrations|Skill Sync Anchor|Fork-Specific Features Checklist|Fork CI Modifications" /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md
```

Replace hardcoded inventory tables with:

````markdown
## Fork Compatibility Checks

Keep reusable historical gotchas only when they encode a concrete invariant or
operator rule. Examples that should remain as short rules are: preserve Gallery's
shipped mobile Drift versions, preserve S3 cleanup branches in media/auth/user
flows, avoid upstream `PUSH_O_MATIC` workflow tokens, and keep Gallery release
image names.

Run these checks after each high-risk batch and before final push:

```bash
make upstream-postrebase-audit BATCH=<batch-id>
make mobile-drift-rebase-check BATCH=<batch-id>
make ci-invariants-check
make fork-patches-check
```

These checks read `docs/fork/ownership.yml`, `pnpm-workspace.yaml`, and the
batch plan emitted by `make upstream-batch-plan`.
````

- [x] **Step 6: Verify the skill has no stale known-bad strings**

Run:

```bash
rg -n "0\\.69\\.0|fork v23/v24 must be renumbered|27 migrations" /home/pierre/.codex/skills/rebase-upstream-report/SKILL.md
```

Expected: no matches.

Implementation note: the previous local skill was backed up to
`/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md.bak-2026-05-04`.

### Task 2: Full Tool Verification

**Files:**

- Read: `docs/fork/ownership.yml`
- Read: `tools/upstream-preflight/**`
- Read: `Makefile`

- [x] **Step 1: Run package verification**

Run:

```bash
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run format
make fork-ownership-coverage-check
```

Expected: all commands pass.

- [x] **Step 2: Run normal Makefile entry points**

Run:

```bash
make upstream-preflight
make upstream-batch-plan
make upstream-postrebase-audit
make upstream-postrebase-audit BATCH=01
make mobile-drift-rebase-check BATCH=01
make ci-invariants-check
make fork-patches-check
```

Expected: `make upstream-preflight`, `make upstream-batch-plan`,
`make ci-invariants-check`, and `make fork-patches-check` pass. On the current
upstream backlog, `make upstream-postrebase-audit` exits non-zero only for the
generated OpenAPI/mobile client/SQL artifact review signal. If
`make ci-invariants-check` fails, the output identifies the exact workflow and
forbidden pattern. The batch audit command writes markdown and JSON under
`$(git rev-parse --git-path upstream-preflight)/batches/` and limits upstream
change signals to the requested batch. The batch-scoped mobile Drift command
passes for batch 01 because that batch does not touch the shipped Gallery Drift
versions.

- [x] **Step 3: Verify intended mobile Drift failure on the current backlog**

Run:

```bash
make mobile-drift-rebase-check
```

Expected on the current upstream backlog: non-zero exit and output containing:

```text
Upstream touches shipped Gallery Drift version v23
Upstream touches shipped Gallery Drift version v24
renumber incoming upstream migrations to v25/v26
```

When the same check is run after an individual batch, use
`make mobile-drift-rebase-check BATCH=NN` so the collision signals are limited
to that batch's planned commits.

- [x] **Step 4: Verify generated artifacts stay out of source**

Run:

```bash
git status --short
find "$(git rev-parse --git-path upstream-preflight)" -maxdepth 2 -type f | sort
```

Expected:

- `git status --short` lists only intentional source edits.
- generated reports live under `$(git rev-parse --git-path upstream-preflight)`.

### Task 3: Final Commit And Handoff

**Files:**

- Modify: `docs/fork/ownership.yml`
- Modify: `tools/upstream-preflight/**`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `Makefile`
- Read: `/home/pierre/.codex/skills/rebase-upstream-report/SKILL.md`

- [x] **Step 1: Commit remaining repo files**

Run:

```bash
git add docs/fork/ownership.yml tools/upstream-preflight pnpm-workspace.yaml pnpm-lock.yaml Makefile
git commit -m "feat: add upstream rebase process tooling"
```

Expected: commit succeeds if previous phase commits did not already include all files.
Implementation note: previous phase commits already captured the tooling; this
phase only commits the plan execution status because the skill update is outside
the repository.

- [x] **Step 2: Record local skill update separately**

Run:

```bash
git status --short
```

Expected: repo status is clean or contains only intentionally uncommitted generated files. The skill update is outside the repo and does not appear in `git status`.

- [x] **Step 3: Prepare final implementation summary**

Use this summary shape:

```markdown
Implemented:

- ownership manifest
- upstream preflight report
- risk-aware batch planner
- mobile Drift collision audit
- CI invariant and patch checks
- post-rebase audit
- local rebase skill rewrite

Verification:

- pnpm --filter @gallery/upstream-preflight run test
- pnpm --filter @gallery/upstream-preflight run check
- pnpm --filter @gallery/upstream-preflight run format
- make fork-ownership-coverage-check
- make upstream-preflight
- make upstream-batch-plan
- make upstream-postrebase-audit
- make upstream-postrebase-audit BATCH=01
- make mobile-drift-rebase-check BATCH=01
- make ci-invariants-check
- make fork-patches-check
- make mobile-drift-rebase-check (expected failure on current upstream v23/v24 collision)
```
