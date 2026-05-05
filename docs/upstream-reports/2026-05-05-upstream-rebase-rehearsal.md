# Upstream Rebase Rehearsal - 2026-05-05

## Scope

Disposable rehearsal worktree:
`/home/pierre/dev/gallery/.claude/worktrees/upstream-rebase-rehearsal`

Branch: `rebase/upstream-rehearsal-20260505`

Tooling source: `plan/upstream-rebase-process` at `ae705ecdd`.

Upstream head used by readiness:
`7acda0572dc3349977d1aa66e90a3ef1474583fa`.

## Readiness

`make upstream-rebase-ready` completed with status `READY`.

Expected warnings and planned resolutions:

- ancestor baseline drift and broad optional mobile coverage warnings
- generated artifact review for OpenAPI, mobile OpenAPI, and SQL artifacts
- mobile Drift v23/v24 collision planning signal

Readiness and batch reports were written under Git metadata:

```bash
$(git rev-parse --git-path upstream-preflight)
```

## Batch 01

`make upstream-next-batch` selected batch 01:

- tip: `f68cd424a7bfe20048d4482cc55ff2b1bf049116`
- risk: medium
- checks: `make upstream-postrebase-audit BATCH=01`,
  `make fork-patches-check`, `make mobile-drift-rebase-check BATCH=01`

The rebase found one conflict:

### Conflict: `web/src/lib/components/asset-viewer/detail-panel-tags.svelte`

- Fork side: space members can see tags, but only owners can remove tags.
- Upstream side: tag removal moved from a manual `IconButton` to the new
  `Badge onClose` API.
- Rehearsal resolution: keep upstream's `Badge onClose` API and make `onClose`
  conditional on `isOwner`, preserving Gallery's owner-only removal behavior
  for space members.
- Risk: medium.
- Verification needed during real rebase: web type check or the asset detail
  path that covers owner and space-member tag rendering.

Batch 01 audit result:

- current fork survival checks passed
- mobile Drift batch check passed
- patch check passed
- generated artifact audit reported
  `server/src/queries/asset.job.repository.sql`

The generated artifact audit is an expected planned stop. Regenerate or review
the affected SQL artifact during the real rebase.

## Batch 02

`make upstream-next-batch` selected batch 02:

- tip: `539a39ae492421c6d386cbd1c3960dce7ac6fafb`
- risk: high
- reasons: shared-spaces extension touch and mobile Drift risk

The rehearsal stopped on fork commit `12edb59cd` with the known mobile Drift
conflict class:

- `mobile/drift_schemas/main/drift_schema_v23.json`
- `mobile/lib/infrastructure/entities/merged_asset.drift.dart`
- `mobile/lib/infrastructure/entities/remote_asset.entity.drift.dart`
- `mobile/lib/infrastructure/repositories/db.repository.dart`
- `mobile/lib/infrastructure/repositories/db.repository.steps.dart`
- `mobile/test/drift/main/generated/schema.dart`
- `mobile/test/drift/main/generated/schema_v23.dart`

This is an expected planned stop, not a tooling failure. During the real rebase,
keep Gallery's shipped v23/v24 Drift versions unchanged and append incoming
upstream migrations above Gallery's current highest version.

## Result

The rehearsal confirmed:

- readiness produces actionable current-backlog planned-resolution output
- persisted batch navigation resumes correctly after batch 01
- batch-scoped audit output limits generated artifact review to batch 01
- the first real conflicts match the documented risk model

No rehearsal branch was pushed.
