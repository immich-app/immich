# Split mobile and server release cycles — design

Date: 2026-04-17

## Problem

`.github/workflows/gallery-release.yml` builds server, ML, and mobile in parallel and promotes everything atomically: docker tags → git tags → GitHub Release → version endpoint at `s3://noodle-prod-version/gallery`. Self-hosted Gallery instances poll the version endpoint, so the moment phase 2 finishes users can upgrade the server.

Mobile app store review takes time — Play Store production rollout and App Store review can take ~24h. The result today: server users upgrade to vX.Y.Z immediately, but the matching mobile build isn't yet on the stores. Mobile trails server.

## Goal

Mobile submission leads server promotion by ~24h while preserving:

- **Same version number** — vX.Y.Z ships to Play / App Store and to ghcr.io / version endpoint.
- **Same commit SHA** — the server image built in phase 2 is built from the SHA the mobile app was built from in phase 1.
- **Same APK** — the APK attached to the GitHub Release is the binary submitted to Play Store, not a rebuild.

## Non-goals

- Automated polling of Play Console / App Store Connect for approval state. The maintainer triggers phase 2 manually after confirming mobile is live.
- Splitting Android and iOS into separate phases. Both are submitted in phase 1.
- Any change to `gallery-rc-build.yml` or the `rc-personal` flow.
- Any change to the `version.json` wire format.

## Server-only follow-up

A third workflow `gallery-release-server-only.yml` (named "Release Gallery Server-only" in the Actions UI) was added after the initial design to handle server / web / docs-only releases that don't need the mobile-review wait. It mirrors phase 2 but computes its own version, builds from `main` HEAD, skips the draft-discovery step, and creates a public GitHub Release with no APK (release notes link to the previous release's APK for sideload users). It shares phase 2's concurrency group (`gallery-release-server`) so the two never race on docker tags / git tags / version endpoint. It also fails fast if a pending phase-1 draft exists, to avoid version-number collision between a server-only release and an in-flight mobile release.

Use server-only for: server bug fixes, web UI tweaks, docs updates. Do NOT use for: major version bumps, or any change that breaks the mobile app's API contract.

## Design

Two manual workflows linked by a draft GitHub Release that carries both the version (tag name) and the commit SHA (`target_commitish`), with the APK attached as a release asset.

### `gallery-release-mobile.yml` (phase 1 — new)

Trigger: `workflow_dispatch` with optional `version` input (manual override, same semantics as today's release workflow).

Steps:

1. **Dupe guard** — fail if any draft GitHub Release exists where the tag matches `v*.*.*` AND has at least one `.apk` asset attached. This is the same composite predicate phase 2 uses for discovery, so what passes the guard is exactly what phase 2 will find. Filter is intentionally narrow: an unrelated manual draft (docs preview, etc.) does not block.
2. **Compute version** — same logic as today's `gallery-release.yml` version job, lifted verbatim. Honors manual override.
3. **Call `gallery-build-mobile.yml`** with `environment: production` and `version: vX.Y.Z`. Builds + signs Android AAB / APK and iOS IPA, uploads the AAB to the Play Store internal track, uploads the IPA to TestFlight, and keeps the AAB as a workflow artifact. Produces `gallery-vX.Y.Z.apk` artifact.
4. **Create draft GitHub Release** — `gh release create vX.Y.Z --draft --target <sha> --title vX.Y.Z -n "<notes>" ./gallery-vX.Y.Z.apk`. The git tag is **not** created here; `gh` creates it lazily when the draft is published.

### Manual step between phases (no workflow)

Maintainer promotes the Play Store internal build to **production** in Play Console and submits App Store for review. Once both stores are live to end users, trigger phase 2.

### `gallery-release.yml` (phase 2 — modified)

Trigger: `workflow_dispatch` with no inputs.

Steps:

1. **Discover pending release** — list draft releases matching the same composite predicate as phase 1's guard (tag matches `v*.*.*` AND has at least one `.apk` asset). Require exactly one. Read tag → `version`, `target_commitish` → `sha`. Fail with a clear message on zero or multiple.
2. **Checkout at `sha`** — not `github.sha`. The server image must be built from the SHA the mobile app was built from.
3. **Build server + ML** — existing matrix, unchanged.
4. **Merge docker manifests** — existing, unchanged. Pushes `ghcr.io/open-noodle/gallery-server:vX.Y.Z`, `:vN`, `:release` and the equivalent for `gallery-ml`.
5. **Tag** — `git tag vX.Y.Z <sha>`, force-move `vN` and `release` to `<sha>`, push all three with `--force` (existing pattern).
6. **Promote draft** — `gh release edit vX.Y.Z --draft=false --latest=true`. Tag already exists at `<sha>` from step 5, so GitHub binds the release to that tag (and the original `target_commitish` is consistent). Existing draft notes are kept.
7. **Publish version endpoint** — write `version.json` to `s3://noodle-prod-version/gallery`. Existing, unchanged.

### `gallery-build-mobile.yml` (modified)

- Play Store fastlane upload is enabled and kept behind the `inputs.version != ''` gate so PR / push-to-main smoke builds remain upload-free.
- No workflow signature change.
- Add a header comment: _"For production releases, trigger via `gallery-release-mobile.yml`. Manual `workflow_dispatch` with a `version` input bypasses the phase-1 handoff and uploads to Play / TestFlight without creating a release draft."_

## Design properties

These are deliberate, not accidents:

1. **Phase 2 builds from the draft's pinned SHA, not from `main`'s HEAD at phase-2 time.** Commits landing on main between phase 1 and phase 2 are excluded from the release and ship in the next cycle. This is the only way to guarantee server / mobile parity.
2. **Phase 2 has no version override input.** It always reads ground truth from the draft. Override exists in phase 1 only.
3. **Step ordering invariant in phase 2** — `merge-server && merge-ml && tag && promote-draft && publish-version-endpoint`. Docker images must exist before the version endpoint flips, otherwise users polling the endpoint will try to pull images that don't yet exist. Any reordering is a safety regression.
4. **Manual edits to the draft's release notes between phases are preserved.** Phase 2 promotes with `gh release edit --draft=false --latest` and never regenerates notes. Maintainers can tweak the notes in the GitHub UI during the 24h wait; those edits survive promotion.
5. **Releases can only be dispatched from `main`.** Both phase 1 and phase 2 fail fast if `github.ref_name != 'main'`. Prevents accidental releases from feature branches.

## Failure modes & recovery

| Scenario                                                                  | Recovery                                                                                                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile rejected by Play / Apple                                           | `gh release delete vX.Y.Z`. Fix. Re-run phase 1. **Caveat:** see "versionCode collision" below — re-run at unchanged SHA will collide.                                    |
| Phase 1 mobile upload succeeds but draft creation fails                   | Mobile is on Play internal / TestFlight at vX.Y.Z but no draft exists. Re-run phase 1 — same versionCode collision risk.                                                  |
| Phase 2 server build fails                                                | Draft intact, re-run phase 2 after fix. No state to clean up.                                                                                                             |
| Two phase 1s race                                                         | `concurrency: gallery-release-mobile` (cancel-in-progress: false) prevents overlap. Dupe guard is belt-and-braces.                                                        |
| Two phase 2s race                                                         | `concurrency: gallery-release-server` (cancel-in-progress: false).                                                                                                        |
| Hotfix urgent during pending draft                                        | Re-run phase 1 from a new SHA — version compute bumps, fresh draft replaces the stale one (after `gh release delete`).                                                    |
| Commits land on main between phases                                       | Excluded from this release by design (see "Design properties #1"). They ship in the next cycle.                                                                           |
| Someone manually triggers `gallery-build-mobile.yml` with a version input | Bypasses phase 1, uploads to Play / TestFlight without creating a draft. Mitigation: header comment in `gallery-build-mobile.yml`. Not preventable at the workflow level. |

## Known issue: versionCode / CFBundleVersion collision on retry

`gallery-build-mobile.yml` computes `version_code=$(git -C .. rev-list --count HEAD)` — deterministic per SHA. Any phase 1 retry at the same SHA produces the same versionCode, which Play Store rejects as a duplicate within a track. iOS has the same problem with `CFBundleVersion`.

This is **pre-existing** (not introduced by this design), but the split design exposes it more often because phase 1 retries become normal operations (mobile rejection, draft creation failure, etc.).

**Resolution:** add `+ GITHUB_RUN_ATTEMPT - 1` to the version code in `gallery-build-mobile.yml` so first attempt keeps existing behavior, retries get distinct codes. Implement as part of this work.

## Permissions

- Phase 1 (`gallery-release-mobile.yml`): `contents: write` (draft + APK asset). Mobile build inherits the existing `mobile-build` environment secrets.
- Phase 2 (`gallery-release.yml`): `contents: write` (tag + promote release), `packages: write` (docker push), `id-token: write` (S3 OIDC). No mobile secrets.

## Test plan

Workflow YAML changes — no automated test infrastructure beyond CI lint. Plan:

1. **Static checks** — shellcheck on every new bash block; `actionlint` on the workflow YAML.
2. **Pre-implementation verification** — confirm `gh release create --draft --target <sha>` + later `gh release edit --draft=false` (with the tag created in between at `<sha>`) preserves the SHA binding. The design assumes this; verify by running the three commands against a throwaway tag in the gallery repo (or any test repo) and inspecting `gh release view --json tagName,targetCommitish`. **Block implementation if this assumption fails.**
3. **Manual end-to-end on a throwaway branch** — trigger phase 1 with a deliberately invalid version (e.g. `v0.0.0-test`) on a non-main branch, inspect:
   - Draft created with correct tag, target_commitish, APK asset
   - Play internal / TestFlight upload completes
   - Phase 2 dry-run reads the draft correctly
     Then `gh release delete v0.0.0-test --cleanup-tag` and `git tag -d v0.0.0-test` if any tag leaked. **Never promote the test draft to a real published release.** Cleaning up Play internal / TestFlight uploads is awkward; accept that the test version sits in those tracks.

No way to safely smoke-test phase 2's docker push + version endpoint publish without a real release. Rely on careful review + the dry-run reading of the draft.

## Migration

Single PR adds `gallery-release-mobile.yml`, modifies `gallery-release.yml` (removes the `build-mobile` job + the version-compute job, adds the discovery step, switches checkout target), modifies `gallery-build-mobile.yml` (uncomment Play Store block, add header comment, add `GITHUB_RUN_ATTEMPT` offset). No data migration. Existing deploy skills (`deploy-gallery-personal`, demo, etc.) and the `rc-personal` flow are unaffected.

The first release after merge:

- Trigger phase 1 → produces draft, submits mobile.
- Manual: promote Play internal → production, submit App Store.
- Wait for both to go live.
- Trigger phase 2 → server promoted, version endpoint flips.

## Open verification before implementation

- [x] **2026-04-17 verified against `open-noodle/gallery`:** `gh release create --draft --target <sha>` + `git tag <ver> <sha>` + push + `gh release edit --draft=false` produces a published release with `targetCommitish: <sha>` and the remote tag pointing at `<sha>`. SHA pinning is preserved end-to-end.
- [x] **2026-04-17 verified:** `gh release edit --latest` moves the `/releases/latest` pointer cleanly. The plan's `gh release edit --draft=false --latest` single-call pattern is safe.
