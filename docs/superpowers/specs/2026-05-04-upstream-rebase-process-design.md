# Upstream Rebase Process Design

Status: approved for implementation planning
Date: 2026-05-04
Worktree: `/home/pierre/dev/gallery`
Branch: `main`

## Problem

Gallery is a fork of Immich with a large and growing fork delta. The current
upstream sync workflow depends on a long skill file that combines process
steps, fork feature inventory, historical incidents, and manual checklists. It
has become hard to keep accurate as the fork changes.

The immediate risk is not just conflict volume. The higher risk is silent drift:
upstream refactors can apply cleanly to upstream-owned code while fork-owned or
fork-extended code keeps the old pattern. Mobile Drift migrations are the most
dangerous case because upstream and Gallery can both claim the same integer
schema versions, which can corrupt shipped client databases if resolved
incorrectly.

## Goals

- Move fork ownership knowledge from the skill into versioned repo data.
- Generate upstream rebase risk reports from git and the ownership manifest.
- Batch upstream integration into smaller, stable steps instead of rebasing all
  incoming commits at once.
- Make high-risk cases visible before rebase work starts.
- Add post-batch audits that verify fork features, CI invariants, package
  patches, server migrations, and mobile Drift migrations.
- Keep the `rebase-upstream-report` skill as an orchestrator, not the source of
  truth for fork inventory.
- Make the process useful for the current upstream backlog, including the
  incoming mobile Drift v23/v24 collision.

## Non-Goals

- Do not redesign the fork architecture in this phase.
- Do not remove the need for human review on high-risk upstream changes.
- Do not force every upstream commit into exactly ten-commit batches; ten is a
  soft cap, not a rule.
- Do not make the first version block normal development branches in CI.
- Do not automatically force-push `main`.

## Architecture

The new process has four repo-owned pieces:

1. `docs/fork/ownership.yml`: machine-readable fork ownership and risk manifest.
2. `tools/upstream-preflight/`: CLI that reads git state and the manifest.
3. Make targets that wrap the CLI and targeted rebase checks.
4. A shorter `rebase-upstream-report` skill that delegates inventory and audits
   to repo tooling.

The skill remains useful for sequencing, checkpoints, and operator discipline.
The repo becomes the authority for what Gallery owns and what must survive each
upstream sync.

## Ownership Manifest

Create `docs/fork/ownership.yml`.

The manifest should be explicit enough to drive automated risk classification
without requiring the tool to understand every feature semantically.

```yaml
version: 1

metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: 919deb87a6477d5058e0fa7b3960d30de577b495

features:
  shared-spaces:
    title: Shared Spaces
    risk: high
    domains: [server, web, mobile, database, e2e]
    owned_paths:
      - server/src/services/shared-space.service.ts
      - server/src/controllers/shared-space.controller.ts
      - server/src/schema/tables/shared-space*.ts
      - web/src/routes/(user)/spaces/**
      - mobile/lib/pages/library/spaces/**
    upstream_extension_paths:
      - server/src/services/search.service.ts
      - server/src/repositories/search.repository.ts
      - server/src/repositories/sync.repository.ts
      - server/src/schema/functions.ts
      - web/src/routes/(user)/photos/**/+page.svelte
      - web/src/routes/(user)/map/**/+page.svelte
    database:
      tables:
        - shared_spaces
        - shared_space_members
        - shared_space_assets
        - shared_space_persons
        - shared_space_libraries
        - library_user
      migration_globs:
        - server/src/schema/migrations-gallery/*SharedSpace*.ts
        - server/src/schema/migrations-gallery/*Library*.ts
    mobile:
      drift_versions:
        owned: [23, 24]
        shipped: true
        owner: gallery
      paths:
        - mobile/lib/infrastructure/repositories/db.repository.dart
        - mobile/drift_schemas/main/drift_schema_v23.json
        - mobile/drift_schemas/main/drift_schema_v24.json
    required_checks:
      - e2e-rebase-smoke
      - mobile-drift-rebase-check

checks:
  e2e-rebase-smoke:
    command: make e2e-rebase-smoke
    phase: post-batch
    required_for_risk: [high]
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
    required_for_domains: [mobile, database]

ci_invariants:
  - id: no-push-o-matic
    title: No upstream PUSH_O_MATIC token dependency
    forbidden_patterns:
      - PUSH_O_MATIC
      - create-workflow-token
    paths:
      - .github/workflows/**/*.yml
      - .github/workflows/**/*.yaml
    exceptions:
      - .github/workflows/merge-translations.yml

patches:
  - id: immich-ui-command-patch
    package: '@immich/ui'
    version_source: pnpm-workspace.yaml
    expected_patch: patches/@immich__ui@0.76.2.patch
    required_check: fork-patches-check
```

### Manifest Sections

`metadata` records the branch assumptions used by preflight commands.

`features` describe fork behavior. Each feature can declare owned paths,
upstream files extended by fork changes, database tables, mobile Drift versions,
and required checks.

`checks` maps check IDs to commands and the phases where they run. Feature
entries should reference check IDs, not raw shell commands, so commands can
change without editing every feature.

`ci_invariants` describe workflow-level conditions that must survive rebase.
The first version should support forbidden grep patterns with explicit
exceptions.

`patches` describe patched third-party packages that need version drift checks.
The first version only needs to validate `@immich/ui`, but the schema should
allow more entries.

`risk_patterns` can be added if needed in implementation. Examples include
commit subject regexes such as `refactor!`, `chore!`, `schemaVersion`,
`migration`, `OpenAPI`, `duration`, `album_user`, and `error response`.

### Initial Manifest Seeding

The first manifest should be seeded from the current skill inventory, the
existing upstream reports, and the real fork delta against `upstream/main`. It
must not be a hand-picked subset.

At minimum, seed entries for:

- every feature currently listed in the skill's core, secondary, mobile, and
  infrastructure tables
- every fork-only workflow and CI invariant
- every `server/src/schema/migrations-gallery/` migration
- every shipped mobile Drift version owned by Gallery
- every package patch listed in `pnpm-workspace.yaml`
- newer features that landed after the skill anchor, including global face
  identities, direct S3 media delivery, typed search filters, rule-based and
  historic memories, Prometheus metrics, recent shared-space identity work, and
  representative face source tracking

`last_verified_fork_head` should be populated when the manifest is first created
and bumped only after the manifest has been reconciled with fork changes that
landed since the previous value.

## Preflight CLI

Create `tools/upstream-preflight/` with a small TypeScript CLI.

TypeScript is preferred because the repo already uses Node tooling and the
reports need to parse YAML, git output, and JSON. The CLI should not require the
app to be built.

Initial commands:

```bash
make upstream-preflight
make upstream-batch-plan
make upstream-postrebase-audit
make mobile-drift-rebase-check
make ci-invariants-check
make fork-patches-check
```

The CLI should emit both Markdown and JSON:

- Markdown: `.git/upstream-preflight/preflight-YYYY-MM-DD.md`
- JSON: `.git/upstream-preflight.json`

The JSON output is for later scripts and CI. The Markdown output is for human
review at the rebase checkpoint. Preflight should not dirty the source tree by
default; a separate `--write-docs-report` option can copy the Markdown into
`docs/upstream-reports/` if an operator intentionally wants to commit it.

## Preflight Report

`make upstream-preflight` should fetch or assume fetched upstream state, then
compare:

- common base: `git merge-base main upstream/main`
- incoming upstream: `<base>..upstream/main`
- current fork delta: `<base>..main`
- direct overlap: files touched by both ranges

The report should include:

- upstream commit count and list
- file and line stats for upstream and fork ranges
- touched-file overlap by domain
- overlap by manifest feature
- high-risk commits sorted by overlap count and risk pattern
- dependency and lockfile changes
- server migration changes and table overlap
- mobile Drift schemaVersion and snapshot changes
- CI workflow changes and invariant violations
- package patch drift
- broad refactor hints
- recommended batch plan

For the current upstream backlog, the preflight must flag that upstream now owns
mobile Drift v23/v24 while Gallery also owns shipped v23/v24. The recommended
resolution must be to keep Gallery v23/v24 and renumber incoming upstream
migrations to v25/v26.

## Batch Planner

The process should integrate upstream in smaller stable batches.

The planner should use risk-aware batching, not strict chronological chunks of
ten. Ten commits is a soft cap for low-risk groups. High-risk commits should be
isolated or placed in very small batches.

Batching rules:

- Keep upstream commit order.
- Start a new batch before any high-risk schema, API, mobile Drift, or broad
  refactor commit.
- Keep a high-risk commit alone when it touches mobile schema, server
  migrations, OpenAPI, or multiple manifest features.
- Group docs, dependency bumps, small UI fixes, and test-only changes when they
  have little or no manifest overlap.
- Do not cross a commit that changes generated API artifacts together with fork
  API extensions unless the batch requires OpenAPI regeneration.

The batch plan should include:

```markdown
| Batch | Tip SHA   | Commits | Risk | Why                        | Required Checks                          |
| ----- | --------- | ------- | ---- | -------------------------- | ---------------------------------------- |
| 01    | ...       | 9       | LOW  | deps/docs/test setup       | check-server, check-web                  |
| 02    | 539a39ae4 | 1       | HIGH | mobile Drift v23 collision | mobile-drift-rebase-check                |
| 03    | 4bfb8b36c | 1       | HIGH | album_user + Drift v24     | mobile-drift-rebase-check, server checks |
```

The planner should also print exact operator commands for each batch.

```bash
git rebase <batch-tip-sha>
make upstream-postrebase-audit BATCH=02
make mobile-drift-rebase-check BATCH=02
git push origin HEAD:rebase/upstream-batch-02 --force
```

## Batch Execution Model

Use a temporary integration branch and leave `main` untouched until all batches
are green.

1. Create a fresh worktree from `main`.
2. Create `rebase/upstream-batched`.
3. Run `make upstream-preflight`.
4. Review and approve the batch plan.
5. Rebase onto batch 1 tip.
6. Resolve conflicts.
7. Run `make upstream-postrebase-audit BATCH=01`.
8. Run required checks for batch 1.
9. Push `rebase/upstream-batch-01` for remote CI when useful.
10. Continue from the stable branch to batch 2 tip.
11. Repeat until the final batch reaches `upstream/main`.
12. Run full local and remote CI.
13. Back up current `origin/main`.
14. Force-push only the final green result to `main`.

Intermediate batch branches are audit artifacts. They do not need to be merged.
Per-batch reports should be generated under `.git/upstream-preflight/batches/`
by default and summarized into the final committed upstream sync report.

## Post-Rebase Audits

`make upstream-postrebase-audit` should compare the current rebased branch to
`upstream/main` or the current batch tip and verify that fork-owned behavior is
still present. When `BATCH=NN` or `--batch NN` is provided, it should persist
batch audit markdown and JSON under
`$(git rev-parse --git-path upstream-preflight)/batches/` and limit upstream
change signals to the selected batch's planned commits. Without `BATCH`, the
audit uses the full incoming upstream range.

Initial audits:

- fork-owned files still exist unless manifest marks them as optional
- fork extension paths still contain expected symbols where specified
- server migration-gallery count and filenames match manifest expectations
- no migration timestamp collision with new upstream migrations
- mobile `schemaVersion` matches highest snapshot
- mobile `fromXToY` chain is contiguous
- shipped Gallery Drift versions are not renumbered
- incoming upstream Drift collisions are reported with renumbering guidance
- CI invariants pass
- package patch versions match `pnpm-workspace.yaml`
- generated OpenAPI and SQL files are either current or explicitly marked for
  regeneration

The audit should fail loudly for irreversible risks, especially mobile Drift
mistakes.

## Mobile Drift Check

`make mobile-drift-rebase-check` should be stricter than the general audit.

It should check:

- current `schemaVersion`
- highest `mobile/drift_schemas/main/drift_schema_vN.json`
- presence of every `fromNToN+1` callback
- duplicate or missing snapshot versions
- manifest-owned shipped versions
- upstream-added versions in the incoming range
- whether any Gallery-owned shipped migration was renumbered

For a collision where both upstream and Gallery own v23/v24 and Gallery's v24 is
shipped, the check should require this strategy:

- Gallery `from22To23` and `from23To24` remain Gallery's implementations.
- Upstream's original v23 callback becomes `from24To25`.
- Upstream's original v24 callback becomes `from25To26`.
- `schemaVersion` becomes 26.
- regenerated snapshots v25/v26 include Gallery v24 plus upstream changes.

When `BATCH=NN` or `--batch NN` is provided, the command should limit incoming
upstream collision signals to that batch's planned commits. Without `BATCH`, it
should inspect the full incoming upstream range.

The check should include a fixture-based migration test in a later phase. The
fixture should represent a real Gallery v24 database before the upstream
collision is applied.

## CI And Patch Checks

`make ci-invariants-check` should read `ci_invariants` from the manifest.

First supported invariant type:

- forbidden grep pattern under path globs with exceptions

This should cover `PUSH_O_MATIC`, `create-workflow-token`, upstream Docker image
references in Gallery release workflows, and accidentally re-enabled upstream
docs deploy triggers.

`make fork-patches-check` should verify:

- `pnpm-workspace.yaml` patched dependency entries exist
- patch filenames match the package version
- patch files exist
- upstream dependency bumps are flagged when they change a patched package

The first high-value check is `@immich/ui`.

## Skill Reshape

The `rebase-upstream-report` skill should become shorter after the tooling
exists.

It should keep:

- worktree setup
- review checkpoints
- conflict documentation requirements
- batch-by-batch execution discipline
- local and remote CI requirements
- final backup and force-push procedure

It should delegate:

- fork feature inventory to `docs/fork/ownership.yml`
- risk report generation to `make upstream-preflight`
- batch planning to `make upstream-batch-plan`
- mobile migration validation to `make mobile-drift-rebase-check`
- CI and package patch invariants to dedicated checks

The skill should also fix current stale or contradictory entries:

- The mobile Drift rule must say incoming upstream v23/v24 are renumbered above
  Gallery's shipped v23/v24.
- The migration-gallery count should be derived from tooling, not hardcoded.
- The `@immich/ui` patch version should be read from the manifest or
  `pnpm-workspace.yaml`, not embedded in prose.

## Rollout

Phase 1: Manifest and read-only preflight.

- Add `docs/fork/ownership.yml`.
- Add CLI skeleton and `make upstream-preflight`.
- Generate Markdown and JSON reports.
- Acceptance: current upstream backlog flags the mobile Drift collision and
  lists high-risk commits by manifest overlap.

Phase 2: Batch planner.

- Add `make upstream-batch-plan`.
- Implement risk-aware partitioning.
- Acceptance: current upstream backlog produces small high-risk batches for
  mobile Drift, album_user, server error responses, video metadata, and
  pgvecto.rs removal.

Phase 3: Post-rebase audits.

- Add `make upstream-postrebase-audit`.
- Add `make mobile-drift-rebase-check`.
- Add `make ci-invariants-check`.
- Add `make fork-patches-check`.
- Acceptance: checks fail on simulated Drift collisions and stale patch versions.

Phase 4: Skill rewrite.

- Replace embedded inventory with references to the manifest and tooling.
- Keep historical gotchas only when they encode a reusable invariant or check.
- Acceptance: the skill is short enough to review and does not duplicate the
  full feature inventory.

Phase 5: Optional CI gates.

- Add workflow support for rebase branches.
- Run preflight/audits on `rebase/upstream-*` branches.
- Keep gates advisory at first, then make selected checks required after the
  process proves stable.

Phase 6: Fork surface reduction follow-up.

- Use the manifest's `upstream_extension_paths` to identify the highest-conflict
  upstream-owned files.
- Move fork behavior behind additive boundaries where practical: fork-only
  server modules, Gallery-owned web components and routes, separate workflows,
  and narrow extension points instead of large edits inside upstream files.
- Track this as follow-up work after the rebase tooling is useful; do not block
  the manifest and preflight rollout on architectural cleanup.

## Testing

Unit tests for the CLI should cover:

- git range parsing
- manifest parsing
- path glob matching
- commit-to-feature risk classification
- batch partitioning
- mobile Drift version detection
- CI invariant matching with exceptions
- patch version drift

Fixture tests should include:

- an upstream batch with no fork overlap
- a broad web rename/refactor batch
- an upstream server migration touching a manifest table
- the current-style mobile Drift v23/v24 collision
- an `@immich/ui` version bump with stale patch metadata

Manual validation for the first implementation should run against the current
real repo state and confirm that the generated report matches the risks found in
the May 4, 2026 investigation.

## Acceptance Criteria

- `make upstream-preflight` produces a useful report without changing source
  files by default.
- The report identifies direct file overlap between fork and upstream.
- The report maps overlap to manifest features.
- The report flags mobile Drift v23/v24 collision in the current upstream
  backlog.
- `make upstream-batch-plan` recommends smaller risk-aware batches.
- `make mobile-drift-rebase-check` can fail on unsafe renumbering.
- `make ci-invariants-check` can detect forbidden upstream CI token usage.
- `make fork-patches-check` can detect patched dependency version drift.
- The rebase skill no longer duplicates stale feature inventory.
- The manifest seeding process captures current fork-owned features and CI
  invariants rather than only the sample `shared-spaces` entry.

## Open Questions

- Should the CLI live under `tools/upstream-preflight/` or `scripts/upstream/`?
  The design prefers `tools/upstream-preflight/` to keep it larger than a shell
  script.
- Should preflight Markdown reports be committed, or should only final sync
  reports be committed? The design commits final sync reports and leaves
  preflight reports as generated artifacts unless the operator chooses to keep
  one.
- Should batch branch CI be mandatory for every batch or only high-risk batches?
  The design starts with high-risk batches only to avoid excessive CI time.
