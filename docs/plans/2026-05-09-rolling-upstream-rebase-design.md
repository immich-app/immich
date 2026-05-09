# Rolling Upstream Rebase Design

## Problem

PR #516 added a safer upstream rebase process: fork ownership is captured in
`docs/fork/ownership.yml`, upstream commits are planned into reviewed batches,
and targeted audits run after each batch.

That process works well for short-lived rebase branches, but it assumes the fork
side is mostly fixed while the operator works through the upstream backlog. For a
large or risky upstream sync, the branch may need to live for days while Gallery
PRs continue to land on `origin/main`. Operators need a safe way to keep pulling
those fork commits into the rebase branch without losing the batch guarantees
introduced by PR #516.

## Goals

- Support a long-lived upstream rebase branch that can be updated from
  `origin/main` between upstream batches.
- Preserve the existing reviewed upstream batch plan and post-batch audit model.
- Make fork catch-up explicit, repeatable, and visible in tooling.
- Prevent final force-pushes when current `origin/main` work has not been
  accounted for.
- Keep operational state out of the working tree and out of committed source
  files.

## Non-Goals

- Do not replace the existing short-lived rebase process.
- Do not merge `origin/main` into the rebase branch.
- Do not automate conflict resolution.
- Do not introduce a permanent integration queue branch in v1.
- Do not silently replan completed upstream batches when `upstream/main` moves.

## Implementation Method

Use test-driven development for the tooling changes. Every behavior-changing
subcommand, state transition, and persisted-plan audit change should start with a
failing test that describes the expected operator-visible behavior. Keep each
test focused on one rule, implement the smallest change that turns it green, and
refactor only after the relevant test is passing.

The implementation order should follow the dependency graph:

1. State schema validation tests before `rolling.ts` persistence helpers.
2. Git helper tests before commands depend on them.
3. Command precondition tests before command happy paths.
4. Failure/recovery tests before enabling state mutation.
5. Documentation updates after command behavior is pinned by tests.

## Recommended Approach

Add a first-class rolling mode around the existing upstream rebase process. The
rolling branch keeps the frozen upstream batch plan from PR #516 and adds a
separate fork-main cursor that records which `origin/main` commit has been
intentionally replayed into the rebase branch.

The key distinction is that upstream progress and fork progress are tracked as
separate axes:

- **Upstream cursor:** derived from `HEAD` and the persisted `batch-plan.json`.
  This answers which upstream batch has been completed.
- **Fork cursor:** stored as `integratedForkHead`. This answers which
  `origin/main` commit has been selected as the latest fork work intentionally
  replayed into the branch.

After rebasing, original `origin/main` SHAs are usually not ancestors of the
rebase branch. `integratedForkHead` is therefore not an ancestry proof. It is a
range cursor for selecting new fork commits and an input to final accounting.

## Rolling State

Store rolling state in Git metadata, scoped to the current worktree:

```text
$(git rev-parse --git-path upstream-preflight)/rolling-state.json
```

Shape:

```ts
{
  version: 1;
  mode: "rolling-upstream-rebase";
  branch: string;
  upstreamRef: string;
  upstreamTargetHead: string;
  forkRef: string;
  startedForkHead: string;
  integratedForkHead: string;
  startedAt: string;
  lastForkSyncAt?: string;
  activeForkSync?: {
    status: "checks-failed";
    from: string;
    to: string;
    commits: string[];
    preSyncHead: string;
  };
  appendHistory?: Array<{
    at: string;
    from: string;
    to: string;
    commits: string[];
    lastCompletedBatch?: string;
    checks: string[];
  }>;
  checkHistory?: Array<{
    at: string;
    phase: "fork-sync" | "final";
    commands: string[];
    ok: boolean;
  }>;
}
```

`integratedForkHead` updates only after a full successful fork sync and required
checks pass. If cherry-picking conflicts, normal Git conflict state is the source
of truth and the cursor remains unchanged. If cherry-picks succeed but required
checks fail, the command records `activeForkSync.status = "checks-failed"` and
refuses further upstream batch work until the operator fixes the problem and
runs the sync command in continue mode. Continue mode reruns the failed checks
and promotes `integratedForkHead` only after they pass.

## Command Surface

Add four Make targets backed by new `@gallery/upstream-preflight` subcommands:

```make
upstream-rolling-start
upstream-rolling-status
upstream-sync-fork-main
upstream-rolling-final-check
```

Make targets that need command options should use environment variables rather
than relying on positional Make arguments. For example,
`make upstream-rolling-start ROLLING_RESUME=1` maps to the CLI's `--resume`
behavior, and `make upstream-sync-fork-main ROLLING_CONTINUE=1` maps to the
CLI's continue mode.

### `make upstream-rolling-start`

Run after `make upstream-rebase-ready` and review of the generated batch plan.

Refuse to start unless:

- the worktree is clean
- the current branch is not `main`
- `batch-plan.json` exists and validates
- `HEAD` is based on the planned fork head, or the operator explicitly resumes an
  existing rolling state
- no rolling state already exists unless `--resume` is passed

Write `rolling-state.json` from the approved batch-plan metadata.

### `make upstream-rolling-status`

Print a compact operator view that is safe to run at any time:

```text
Branch: rebase/upstream-2026-05
Upstream target: upstream/main @ abc123
Completed upstream batches: 03 / 09
Integrated fork head: origin/main @ def456
Current origin/main: ghi789
Fork commits pending: 2
Next action: run make upstream-sync-fork-main or make upstream-next-batch
```

### `make upstream-sync-fork-main`

This is the main rolling workflow. It is allowed only at a clean batch boundary.

Preconditions:

- no dirty worktree
- no rebase, merge, or cherry-pick in progress
- current `HEAD` includes at least one known batch tip, or the branch has not
  started upstream work yet
- the persisted batch plan still matches the frozen upstream target

Flow:

1. Fetch `origin/main`.
2. Compute pending fork commits as `integratedForkHead..origin/main`.
3. Print the pending commits and stop if the list is empty.
4. Cherry-pick the commits in order.
5. On conflict, stop and leave rolling state unchanged.
6. After successful cherry-picks, record an `activeForkSync` attempt before
   running checks.
7. Run cheap integrity checks:
   - `make fork-ownership-coverage-check`
   - `make ci-invariants-check`
   - `make fork-patches-check`
   - `make upstream-postrebase-audit BATCH=NN` for the last completed batch, if
     any
8. If checks fail, keep `activeForkSync` and do not update `integratedForkHead`.
9. If checks pass, update `integratedForkHead` to the fetched `origin/main`.
10. Append a sync event to `appendHistory` and clear `activeForkSync`.

Fork sync must happen between upstream batches, never during unresolved conflict
resolution.

Continue mode is only valid when `activeForkSync.status = "checks-failed"`.
It does not cherry-pick again. It reruns the required checks against the current
`HEAD`, then either promotes the cursor or leaves the failed sync active.

### `make upstream-rolling-final-check`

Run immediately before the final `push-rebase` safety flow or any force-push.

Block if:

- `HEAD` does not include the frozen upstream target head
- current `origin/main` is ahead of `integratedForkHead`
- any fork PR or merge-title from `upstream/main..origin/main` lacks a
  corresponding rebased commit in `upstream/main..HEAD`
- patch-equivalence checks show unexpected missing fork patches
- any `activeForkSync` is still present
- required final checks fail when run by this command

The final check should run the deterministic local checks that do not require a
full dev stack:

```bash
make fork-ownership-coverage-check
make upstream-next-batch
make upstream-postrebase-audit
make ci-invariants-check
make fork-patches-check
pnpm --filter @gallery/upstream-preflight run test
pnpm --filter @gallery/upstream-preflight run check
pnpm --filter @gallery/upstream-preflight run format
```

Remote CI and expensive domain suites remain part of the existing final upstream
rebase process, but they are not hidden inside `upstream-rolling-final-check`.

This command does not replace the `push-rebase` skill. It gives that flow a
stricter machine-readable precondition.

## Operator Flow

The rolling rhythm is:

```bash
make upstream-rebase-ready
make upstream-rolling-start

make upstream-next-batch
git rebase <batch-tip>
make upstream-postrebase-audit BATCH=01

make upstream-sync-fork-main

make upstream-next-batch
git rebase <batch-tip>
# repeat batches and fork syncs as needed

make upstream-rolling-final-check
```

The existing short-lived process remains valid. Rolling mode is used when the
upstream backlog is large, high-risk, or likely to overlap with active Gallery
PRs.

If `make upstream-sync-fork-main` reports check failures after successful
cherry-picks, the branch is intentionally paused. The operator fixes the failing
checks in normal commits or conflict-resolution commits, then runs:

```bash
make upstream-sync-fork-main ROLLING_CONTINUE=1
```

No upstream batch command should proceed while a failed fork sync is active.

## Persisted Batch Scope

Batch-scoped audit commands should use the persisted batch plan, not freshly
rebuilt context from moving refs.

Today, `upstream-next-batch` already reads `batch-plan.json`, but
`postrebase-audit --batch NN` and `mobile-drift-check --batch NN` rebuild
preflight context before selecting batch files. In rolling mode, `origin/main`
may have moved after the batch plan was approved, so rebuilding the plan can make
batch scope drift.

Change the rule to:

```text
For BATCH=NN, batch-plan.json is the source of truth.
For unscoped reports, current refs may be used.
```

Affected commands:

```bash
make upstream-postrebase-audit BATCH=NN
make mobile-drift-rebase-check BATCH=NN
make upstream-next-batch
```

## Tooling Architecture

Add a rolling module:

```text
tools/upstream-preflight/src/rolling.ts
```

Responsibilities:

- read, write, and validate `rolling-state.json`
- detect dirty worktrees and in-progress Git operations
- compute pending fork commits from `integratedForkHead..origin/main`
- render rolling status
- validate agreement between rolling state and the persisted batch plan
- record successful fork syncs
- run final fork-accounting checks

Add Git helpers for:

```ts
isCleanWorktree();
hasGitOperationInProgress();
currentBranch();
listCommits(range);
commitSubjects(range);
cherryEquivalent(leftRange, rightRange);
```

`cherryEquivalent` can wrap `git cherry` or equivalent patch-id logic.

## Final Fork Accounting

No single Git check is enough after rebasing, because rebased commits have new
SHAs and conflict resolutions may intentionally change patches. Use layered
checks:

- **Cursor check:** fetched `origin/main` must equal `integratedForkHead`.
- **PR/title check:** every fork PR or merge-title in
  `upstream/main..origin/main` should appear in `upstream/main..HEAD`.
- **Patch check:** `git cherry` or equivalent should not show unexpected missing
  fork patches.
- **Review output:** ambiguous commits are printed in a table for operator
  review instead of being hidden.

This preserves the practical behavior of the existing `push-rebase` skill while
making the rolling branch state explicit.

## Upstream Moved Case

Keep v1 conservative.

If `upstream/main` moves while a rolling branch is in progress, continue to the
approved `upstreamTargetHead`. Do not silently regenerate or renumber completed
batches.

After the branch reaches the frozen target and passes checks, either finish and
push, or start an explicit follow-up flow to extend the upstream target. An
`upstream-rolling-extend` command can be designed later if this becomes common.

## Documentation Updates

Update `docs/docs/developer/upstream-rebase-process.md` with a new "Rolling
Rebase Branches" section.

Document:

- when to use rolling mode versus the existing short-lived process
- the required separate worktree
- the no-merge rule for `origin/main`
- the batch-boundary-only sync rule
- the check-failure continue flow for fork syncs
- the final-check requirement before force-pushing
- the conservative upstream-moved behavior

Also update the local operator documentation around `push-rebase` so final
force-push guidance says to run `make upstream-rolling-final-check` first when a
rolling state file is present.

Documentation acceptance criteria:

- A new operator can identify when rolling mode is appropriate.
- The happy-path command sequence is copy-pastable.
- The failed-check recovery path is documented.
- The upstream-moved behavior is explicit and conservative.
- The final push section calls out rolling final-check as a required preflight.

## Testing Strategy

Use TDD for each bullet below: write the failing test first, verify it fails for
the expected reason, implement the smallest production change, then rerun the
focused test before broadening.

State and validation unit tests should cover:

- rolling state shape validation accepts valid v1 state
- invalid state version, mode, branch, refs, timestamps, and SHA fields fail with
  actionable errors
- state is read from `git rev-parse --git-path upstream-preflight`, not the
  working tree
- active failed sync state blocks upstream batch selection and final checks

Command unit tests should cover:

- start refuses dirty worktree, `main`, missing plans, and stale plans
- start refuses branch/plan mismatches unless resume mode is explicit
- status reports completed batches and pending fork commits
- sync computes `integratedForkHead..origin/main` correctly
- sync prints and exits cleanly when no fork commits are pending
- sync does not update state on cherry-pick conflict
- sync records `activeForkSync` when cherry-picks succeed but checks fail
- continue mode reruns checks without cherry-picking duplicate commits
- continue mode promotes `integratedForkHead` and clears `activeForkSync` after
  checks pass
- sync updates state after successful cherry-pick and checks
- batch-scoped audits read persisted batch scope even when refs moved
- final-check blocks when `origin/main` moved after the last sync
- final-check blocks while an active failed sync exists
- final-check flags missing PR/title matches
- final-check reports patch-equivalence mismatches without hiding ambiguity

Integration-style fixture tests should model:

- upstream batch progress followed by a fork sync
- fork sync before any upstream batch
- conflict during fork sync
- checks failing after fork cherry-picks and succeeding through continue mode
- `upstream/main` moving after the approved target
- `origin/main` moving again between status and final-check
- batch-scoped mobile Drift and post-rebase audits staying pinned to the
  persisted plan after refs move

Documentation tests are not required, but implementation PR review should verify
that `docs/docs/developer/upstream-rebase-process.md` includes every documented
operator state: start, status, next batch, fork sync, failed-check continue,
final-check, and upstream moved.

## Rollout Plan

Phase 1:

- Add this design document.
- Add failing tests for rolling state validation, command preconditions, fork
  sync recovery, final accounting, and persisted batch scope.
- Add process documentation for rolling branches.
- Add rolling state read/write/validation.
- Add start/status/sync/final-check commands.
- Align batch-scoped audits with persisted `batch-plan.json`.
- Keep the implementation in red-green-refactor slices; do not batch all command
  behavior under one broad test.

Phase 2, only if needed:

- Add an explicit upstream target extension command.
- Improve final accounting with richer PR-number parsing.
- Feed rolling final-check output directly into the `push-rebase` flow.

## Risks And Mitigations

| Risk                                                                                                             | Mitigation                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cherry-picking fork commits after upstream batches creates different conflicts than the final rebase would have. | Allow fork sync only at batch boundaries and rerun fork checks plus the last completed batch audit after each sync. |
| PR/title matching misses squash commits or edited commit messages.                                               | Combine cursor, title, and patch-equivalence checks, then print ambiguous rows for manual review.                   |
| The branch grows stale against upstream.                                                                         | Freeze the upstream target in v1 and require an explicit follow-up flow to extend it.                               |
| Operators bypass the rolling commands.                                                                           | Make final-check and push-rebase integration the force-push guardrails.                                             |
| State gets out of sync after a failed sync.                                                                      | Record `activeForkSync` after successful cherry-picks and require continue mode before upstream work can proceed.   |

## Open Questions

- Should final accounting parse PR numbers only, or also support trailer-based
  metadata if Gallery starts adding it?
- Should checkpoint branches include the fork-sync cursor in the branch name or
  only in the rolling status output?
