# Upstream Rebase Process

Gallery is a fork of Immich. Keeping the fork current is risky because Gallery
has a large fork-owned surface area across server, web, mobile, machine
learning, CI, generated clients, and database migrations. A clean Git conflict
resolution is not enough: upstream can change extension points that compile but
silently remove Gallery behavior.

This process keeps upstream syncs reviewable by making fork ownership explicit,
planning the rebase in small batches, and running targeted audits after each
batch.

## Source Of Truth

Fork ownership is tracked in:

```text
docs/fork/ownership.yml
```

The manifest is the source of truth for:

- fork-owned files and directories
- upstream extension paths where Gallery behavior is injected into upstream code
- expected symbols that must survive in extension files
- Gallery-owned database migrations and migration globs
- shipped mobile Drift versions
- generated artifacts that need explicit review
- CI workflow invariants
- package patches
- risk patterns and required checks

Do not reconstruct fork ownership from memory or from an agent skill. If a fork
feature is missing from the manifest, update the manifest first and run the
coverage check.

## Local Setup

Fetch the current fork and upstream refs:

```bash
git fetch origin main --no-tags
git fetch upstream main --no-tags
```

Use a fresh worktree for the upstream rebase:

```bash
git worktree remove --force .claude/worktrees/upstream-rebase 2>/dev/null || true
git worktree add .claude/worktrees/upstream-rebase origin/main
cd .claude/worktrees/upstream-rebase
git checkout -B rebase/upstream-batched
```

Do not run the rebase directly on `main`. Use the temporary branch until every
batch is verified and the final result is approved.

## Manifest Baseline

The manifest records the fork head it was last verified against:

```yaml
metadata:
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: <full origin/main sha>
```

Before starting an upstream sync, confirm the manifest is current:

```bash
make fork-ownership-coverage-check
```

This target treats `last_verified_fork_head` as the reviewed floor for the
manifest, not as a permanent lock to the current fork head. It:

1. Lists fork files with `git diff --name-only upstream/main...origin/main`.
2. Checks that every fork file is covered by `docs/fork/ownership.yml`, unless
   it is explicitly ignored.
3. Compares `metadata.last_verified_fork_head` with `git rev-parse
origin/main`.

Baseline outcomes:

- Exact match: the manifest is current.
- Baseline is an ancestor of `origin/main`: the check passes with warnings and
  lists files changed since the manifest was verified.
- Baseline is not an ancestor of `origin/main`: the check fails because the
  manifest baseline does not describe the current fork history.

The coverage check always runs against the full fork delta, not only files
changed since the manifest baseline. The changed-since-baseline list is a review
aid for manifest maintenance.

Broad optional manifest globs such as `mobile/**`, `docs/**`, or
`server/src/**` are allowed as safety nets. Files changed after the manifest
baseline that are covered only by those broad optional globs produce warnings.
To make those warnings blocking during manifest cleanup, run:

```bash
pnpm --filter @gallery/upstream-preflight run coverage -- /tmp/gallery-fork-files.txt docs/fork/ownership.yml --expected-head "$(git rev-parse origin/main)" --strict-broad-coverage
```

## Preflight

Run the readiness command before rebasing:

```bash
make upstream-rebase-ready
```

Readiness writes fresh preflight, batch plan, and readiness reports under Git
metadata:

```bash
$(git rev-parse --git-path upstream-preflight)
```

It fails for blockers such as uncovered fork files, non-ancestor manifest
baselines, CI invariant failures, package patch failures, and current fork
integrity failures. It passes with warnings for ancestor baseline drift and
broad optional coverage. Known upstream work such as mobile Drift renumbering,
generated artifact review, and migration timestamp collisions is listed as
planned resolution work.

You can still run the preflight report directly:

```bash
make upstream-preflight
```

The report is printed to stdout and written under:

```bash
git rev-parse --git-path upstream-preflight
```

The preflight report includes:

- merge base
- incoming upstream commits and files
- fork delta files
- direct overlap files
- high-risk commits
- dependency and lockfile changes
- server migration and table overlap signals
- mobile Drift collision signals
- CI workflow signals
- broad refactor hints
- audit signals
- recommended batch plan
- fork surface reduction signals

Review the report before rebasing. Pay particular attention to high-risk
commits, direct overlaps, mobile Drift collisions, generated artifacts, and
workflow changes. The fork-surface section is advisory and should be interpreted
with the [fork surface guidelines](./fork-surface-guidelines.md).

## Batch Plan

Generate the batch plan:

```bash
make upstream-batch-plan
```

The planner prints Markdown and writes the persisted plan under Git metadata:

```bash
$(git rev-parse --git-path upstream-preflight)/batch-plan.md
$(git rev-parse --git-path upstream-preflight)/batch-plan.json
```

The JSON includes the merge base, manifest-defined upstream and fork refs, the
current upstream and fork heads, the manifest baseline, generation time, and the
batch soft cap. Batch tips and commit entries are stored as full SHAs; Markdown
uses short SHAs only for readability.

The planner keeps upstream commit order and groups low-risk commits together up
to a soft cap. It isolates high-risk commits and commits that touch multiple
manifest features or generated API artifacts.

Each batch includes:

- batch id
- upstream tip SHA
- commit count
- risk level
- whether it is a checkpoint
- reasons
- cheap post-batch checks
- expensive checkpoint checks
- exact operator commands

Example:

```bash
git rebase <batch-tip-sha>
make upstream-postrebase-audit BATCH=02
make mobile-drift-rebase-check BATCH=02
make e2e-rebase-smoke
git push origin HEAD:rebase/upstream-batch-02 --force
```

Cheap checks run after every affected batch. Expensive checks and remote pushes
only render at checkpoints. Checkpoints are selected conservatively: every
high-risk batch, any low/medium run after roughly ten cumulative upstream
commits, and the final batch.

Review and approve the batch plan before starting the rebase.

## Rebase Mechanics

Before each rebase step, ask the tool which persisted batch is next:

```bash
make upstream-next-batch
```

This validates that `batch-plan.json` still matches the current upstream ref,
then prints the next batch id, full tip SHA, risk, reasons, and exact commands.
If upstream moved, rerun `make upstream-batch-plan` and review the new plan
before continuing.

Rebase the fork stack from one upstream batch tip to the next. The command
printed by `make upstream-next-batch` uses the full persisted batch tip:

```bash
git rebase <full-batch-tip-sha>
```

The equivalent manual form is:

```bash
BASE="$(git merge-base origin/main upstream/main)"
NEXT="<batch-tip-sha>"
git rebase --onto "$NEXT" "$BASE" HEAD
```

After a batch succeeds, run the printed audit commands and then run
`make upstream-next-batch` again. The tool derives completed batches from
`HEAD`, so operators do not need to track `BASE` or `NEXT` manually. Repeat
until it reports that the branch already includes `upstream/main`.

When conflicts occur, record the conflict resolution:

```markdown
### Conflict: <file path>

- Fork side: <what Gallery was doing>
- Upstream side: <what upstream changed>
- Resolution: <what was kept or adapted and why>
- Risk: LOW / MEDIUM / HIGH
- Verification needed: <specific command or manual check>
```

For conflict-resolved files, compare against upstream to catch accidental
deletions:

```bash
git diff upstream/main..HEAD -- <file>
```

For lockfile conflicts, usually take upstream, then regenerate from the repo
root:

```bash
pnpm install --no-frozen-lockfile
```

Review the resulting lockfile diff before continuing.

## Post-Batch Audits

After every batch, run the post-rebase audit with the batch id:

```bash
make upstream-postrebase-audit BATCH=NN
```

With `BATCH=NN`, generated artifact and migration-collision signals are scoped
to that batch's planned upstream commits. Without `BATCH`, the command inspects
the full incoming upstream range.

Batch reports are written under:

```bash
$(git rev-parse --git-path upstream-preflight)/batches/
```

The post-rebase audit checks:

- literal fork-owned files still exist
- expected symbols still exist in extension paths
- Gallery migration count matches manifest expectations
- expected Gallery migration filenames still exist
- migration globs still match files
- incoming upstream migration timestamps do not collide with Gallery migrations
- generated OpenAPI, mobile OpenAPI, and SQL artifacts are reviewed

A generated artifact issue is not automatically a bad rebase. It means the
affected artifacts must be regenerated or explicitly reviewed before final push.

## Mobile Drift

Mobile Drift migrations are high risk because bad version handling can corrupt
existing mobile databases.

Run the full backlog check before rebasing:

```bash
make mobile-drift-rebase-check
```

On a backlog where upstream touches shipped Gallery Drift versions, this command
should fail and tell you to renumber incoming upstream migrations above
Gallery's current highest shipped version.

After an individual batch, scope the check:

```bash
make mobile-drift-rebase-check BATCH=NN
```

The batch-scoped command only considers Drift collision signals from that
batch's planned commits.

Rules:

- Keep Gallery's shipped versions unchanged.
- Append incoming upstream migrations above Gallery's highest version.
- Keep `schemaVersion` equal to the highest checked-in snapshot.
- Keep `mobile/drift_schemas/main/drift_schema_vN.json` contiguous.
- Keep every `fromNToN+1` callback present exactly once.
- Stop for review if any Drift renumbering is non-additive or ambiguous.

For the current v23/v24 collision pattern, the expected strategy is:

- Gallery v23 and v24 remain Gallery's shipped migrations.
- Upstream's original v23 becomes the next available version.
- Upstream's original v24 becomes the version after that.
- Snapshots and callbacks are appended above Gallery's current highest version.

## CI And Patch Checks

Run these when `make upstream-next-batch` prints them after affected batches and
before final push:

```bash
make ci-invariants-check
make fork-patches-check
```

`make ci-invariants-check` verifies manifest-defined workflow invariants, such
as avoiding upstream `PUSH_O_MATIC` token dependencies and keeping Gallery image
names in release workflows.

`make fork-patches-check` verifies package patch metadata, including expected
patch files and references in `pnpm-workspace.yaml`.

## Generated Artifacts

If preflight or post-rebase audits report generated artifacts, regenerate them
after the affected upstream batch:

```bash
make build-server
make open-api
make sql
```

`make sql` may require a local development database. If generation cannot run
locally, keep the audit issue visible and use CI output to complete the
regeneration before the final push.

Generated batch reports and preflight reports are written to Git metadata, not
the working tree. They should not appear in `git status`.

## Final Verification

Before asking to update `main`, run:

```bash
pnpm install --frozen-lockfile
make fork-ownership-coverage-check
make upstream-rebase-ready
make upstream-preflight
make upstream-batch-plan
make upstream-next-batch
make upstream-postrebase-audit
make ci-invariants-check
make fork-patches-check
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run format
```

Also run the required checks listed by each batch and any domain-specific suites
for touched areas.

Expected current-backlog signals are allowed only when they match the known
planning signals:

- unbatched `make mobile-drift-rebase-check` reports shipped Gallery v23/v24
  collisions and tells you to renumber incoming upstream migrations
- unbatched `make upstream-postrebase-audit` reports generated artifacts that
  need review or regeneration
- `make upstream-postrebase-audit BATCH=01` reports only batch 01 generated
  artifacts

Unexpected audit failures should stop the rebase until they are understood.

## Current Backlog Notes

A disposable rehearsal against `upstream/main` at
`7acda0572dc3349977d1aa66e90a3ef1474583fa` confirmed these expected stops for
the current backlog:

- Batch 01 rebases after one web conflict in
  `web/src/lib/components/asset-viewer/detail-panel-tags.svelte`. Preserve
  upstream's `Badge onClose` API while keeping Gallery's owner-only tag removal
  behavior for space members.
- Batch 01 post-rebase audit reports generated artifact review for
  `server/src/queries/asset.job.repository.sql`.
- Batch 02 reaches the known mobile Drift conflict on fork commit `12edb59cd`.
  The conflicted files include `mobile/drift_schemas/main/drift_schema_v23.json`,
  generated Drift files, and `mobile/lib/infrastructure/repositories/db.repository.dart`.
  Resolve this during the real rebase by keeping Gallery v23/v24 shipped
  versions and appending incoming upstream migrations above Gallery's current
  highest version.

## Final Push

Before force-pushing `main`, create a backup branch:

```bash
git fetch origin main --no-tags
git branch "backup/main-before-upstream-rebase-$(date +%Y%m%d-%H%M)" origin/main
```

Confirm the final branch contains:

- all current `origin/main` commits
- all approved fork commits replayed on upstream
- all resolved conflicts
- all regenerated artifacts needed by the rebase

Prefer the `push-rebase` skill for the final force push so missing PR commits
are detected before `origin/main` is updated.

After pushing, babysit required CI until green. Do not merge or force-push a
partially verified upstream sync.

## Troubleshooting

### The manifest coverage check fails

If files are uncovered, add the missing ownership entries or coverage ignores.
If only `last_verified_fork_head` is stale, refresh it to `git rev-parse
origin/main` after confirming the manifest still covers the current fork diff.

### A batch audit reports future-batch files

Use `BATCH=NN`. Batch-scoped audits should use only that batch's planned
commits. If an audit still reports future-batch files, regenerate the batch plan
and inspect the batch id.

### The mobile Drift check fails after a batch

If the batch touches shipped Gallery Drift versions, resolve the collision by
keeping Gallery's shipped versions and appending upstream migrations above them.
If the batch does not touch those versions, rerun with `BATCH=NN` and inspect
the batch plan.

### CI invariant checks fail

Read the exact workflow path and forbidden pattern in the output. Either restore
the Gallery invariant or add a narrow manifest exception only when the exception
is intentional and documented.

### Patch checks fail

Confirm the expected patch file exists and `pnpm-workspace.yaml` references it.
Do not remove a fork patch just to make the check pass; verify whether the patch
is still required against the upstream version.
