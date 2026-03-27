# Upstream Sync Report — 2026-03-27

## Summary

- **Upstream commits pulled**: 44 (Immich v2.6.3)
- **Conflicts resolved**: 8 (6 text conflicts + multiple Dart binary conflicts across multiple fork commits)
- **Risk level**: MEDIUM
- **Recommendation**: PROCEED (all issues identified and resolved)

## Incoming Upstream Changes

| SHA       | Summary                                   | Area        | Risk to Fork | Notes                                                                                                   |
| --------- | ----------------------------------------- | ----------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| 8c6adf715 | feat: resolve duplicates (batch sync)     | server, web | HIGH         | New migration, endpoint, changes access.repository.ts, test factories, OpenAPI spec (42 files, +2058)   |
| 22bf7c200 | feat: add checksum algorithm field        | server      | HIGH         | New enum, migration 1774548649115, schema change to asset.table.ts, metadata.service.ts, test factories |
| 7877097b3 | refactor: asset viewing store             | web         | HIGH         | Deletes asset-viewing.store.ts, moves to asset-viewer-manager.svelte.ts, touches 20 files               |
| 940a1d4ab | refactor: change location                 | web         | MEDIUM       | Renames ChangeLocation.svelte to GeolocationPointPickerModal.svelte                                     |
| 389356149 | refactor: actionable toasts               | web         | MEDIUM       | Removes ToastAction.svelte, changes album.service.ts, asset-utils.ts                                    |
| b33874ef1 | feat: helmet configuration                | server      | MEDIUM       | Changes app.common.ts, config.repository.ts, new helmet.json                                            |
| dbaf4b548 | fix: pin success-check-action             | CI          | HIGH         | Modifies docker.yml (which we renamed to release.yml — conflict expected)                               |
| c86216320 | fix: auto-close repo specification        | CI          | MEDIUM       | Modifies auto-close.yml where we removed template enforcement                                           |
| d8b39906f | fix: incorrect asset face sync            | server      | MEDIUM       | New migration 1774393726320, changes sync.repository.ts                                                 |
| b36911a16 | fix: filter empty search suggestions      | server      | MEDIUM       | Changes search.repository.ts where we have space filtering                                              |
| 9f699fdfc | deps: update typescript-projects          | deps        | MEDIUM       | 1955-line pnpm-lock.yaml change                                                                         |
| 5c159d70a | deps: Node.js v24.14.0                    | deps        | LOW          | Minor version bump within Node 24                                                                       |
| f78278266 | deps: Kysely v0.28.14 (security)          | deps        | LOW          | Patch bump, security fix                                                                                |
| a2ff075e9 | version v2.6.3                            | all         | LOW          | Version bumps across all packages                                                                       |
| 8bfa75087 | base-image update                         | Docker      | LOW          | server/Dockerfile base image tag                                                                        |
| 44ae0fa7e | fix: database restore onboarding          | server      | LOW          | Changes app.common.ts, app.module.ts                                                                    |
| 4812a2e2d | fix: refresh asset dimensions             | server      | LOW          | Changes metadata.service.ts                                                                             |
| 7d58d5be1 | refactor: memory manager                  | web         | LOW          | Renames memory.store.ts to memory-manager.svelte.ts                                                     |
| 144a57ddf | refactor: shared link queries             | server      | LOW          | Changes shared-link.repository.ts                                                                       |
| 448c069fb | feat: rotate image shortcuts              | web         | LOW          | Adds keyboard shortcuts to editor                                                                       |
| 67cedfef1 | feat: RemoveFromAlbumAction in viewer     | web         | LOW          | Changes asset-viewer.svelte, TimelineAssetViewer.svelte                                                 |
| 47b45453c | refactor: activity status                 | web         | LOW          | Minor component refactor                                                                                |
| 48fdd39d3 | feat: use UI pin input                    | web         | LOW          | Removes custom PinCodeInput.svelte                                                                      |
| fb84c1cf6 | remove unused album-asset-selection.store | web         | LOW          | File deletion                                                                                           |
| 9b78f2c0b | remove unused map style resources         | server      | LOW          | Removes resources/style-\*.json                                                                         |
| 8dd0d7f34 | fix: memory fragmentation                 | server      | LOW          | server/bin/start.sh only                                                                                |
| fae25dbe6 | whitelist server deploy files             | server      | LOW          | server/package.json files field                                                                         |
| e2d26ebde | fix: Safari live photo overwrite          | web         | LOW          | No fork overlap                                                                                         |
| eeb55c279 | fix: preserve timezone                    | web         | LOW          | No fork overlap                                                                                         |
| c9c2322b9 | feat: face editor search focus            | web         | LOW          | No fork overlap                                                                                         |
| 958f270f0 | fix: keep map view open                   | web         | LOW          | Minor map page change                                                                                   |
| 1bd2d474d | fix: command palette                      | web         | LOW          | Minor dep bump                                                                                          |
| 8f01d0692 | feat: dark/light mode tooltip             | web         | LOW          | No fork overlap                                                                                         |
| Other     | 10 remaining LOW risk commits             | various     | LOW          | Security patches, docs, CSS fixes, logging, grafana, renovate config                                    |

### High-Risk Changes (detailed analysis)

**8c6adf715 — Resolve duplicates**

- Adds new `POST /duplicates/resolve` endpoint with batch sync
- New migration `1774548649115`
- Changes `access.repository.ts` (adds `DuplicateAssetAccess`) — our fork extends this file with space access checks. Auto-merged correctly.
- Changes `test/mappers.ts` and `test/factories/asset.factory.ts` — our fork extends these. Auto-merged correctly.
- Changes `persisted.ts` — no fork overlap

**22bf7c200 — Checksum algorithm field**

- New `ChecksumAlgorithm` enum in `enum.ts` and schema change to `asset.table.ts`
- New migration `1774548649115` (same timestamp as duplicates? Actually different file)
- Changes `metadata.service.ts` where we have `ensureLocalFile` wrapping — conflict resolved by taking upstream's inner block (new dimension/checksum logic) while preserving our try/finally wrapping

**7877097b3 — Asset viewing store refactor**

- Deletes `web/src/lib/stores/asset-viewing.store.ts`
- Moves functionality to `web/src/lib/managers/asset-viewer-manager.svelte.ts`
- Our fork's `asset.service.ts` had a stale import of the deleted store — **fixed during rebase review**

## Conflict Resolutions

### Conflict: pnpm-lock.yaml

- **Fork side**: Fork's lockfile with AWS S3 dependencies
- **Upstream side**: Updated lockfile with new dependency versions
- **Resolution**: Took upstream's version, then ran `pnpm install --no-frozen-lockfile` to regenerate with fork's deps
- **Risk**: LOW
- **Verification needed**: Build should succeed with regenerated lockfile

### Conflict: server/src/services/metadata.service.ts

- **Fork side**: Empty (no fork changes to inner extraction block)
- **Upstream side**: Added `isEdited` dimension check, checksum algorithm support
- **Resolution**: Took upstream's updated extraction block. Our fork's `ensureLocalFile` try/finally wrapping (above the conflict zone) was preserved by auto-merge.
- **Risk**: LOW
- **Verification needed**: Type check passes, metadata extraction works correctly

### Conflict: web/src/lib/modals/GeolocationPointPickerModal.svelte

- **Fork side**: Old imports (`get` from svelte/store, `LoadingSpinner`, `Point` interface) from when file was at `change-location.svelte`
- **Upstream side**: Clean version without those imports (refactored)
- **Resolution**: Took upstream's version (removed stale imports)
- **Risk**: LOW
- **Verification needed**: Geolocation modal works correctly

### Conflict: web/src/routes/(user)/map/+page.svelte

- **Fork side**: Had `assetViewingStore` destructure + `spaceId` derived
- **Upstream side**: Removed `assetViewingStore` (uses `assetViewerManager` now)
- **Resolution**: Kept fork's `spaceId` derived, removed stale `assetViewingStore` destructure. Upstream's `assetViewerManager` pattern already in the auto-merged imports.
- **Risk**: LOW
- **Verification needed**: Map page with space filtering works

### Conflict: mobile/pubspec.yaml

- **Fork side**: `version: 1.0.0+1` (Play Store release version)
- **Upstream side**: `version: 2.6.3+3041`
- **Resolution**: Kept fork's version (1.0.0+1)
- **Risk**: LOW
- **Verification needed**: None — intentional fork versioning

### Conflict: server/src/repositories/search.repository.ts

- **Fork side**: `getExifField` with generic type param, `SpaceScopeOptions`, space asset subquery
- **Upstream side**: Added `.where(field, '!=', '')` filter for empty suggestions
- **Resolution**: Merged both changes — kept fork's generic signature + space options AND added upstream's empty string filter
- **Risk**: LOW
- **Verification needed**: Search suggestions work with and without space filtering

### Conflict: docs/docs/install/environment-variables.md

- **Fork side**: Rebranded "Immich server" to "Gallery server" in CPU_CORES row
- **Upstream side**: Added new `IMMICH_HELMET_FILE` and `IMMICH_ALLOW_SETUP` rows
- **Resolution**: Kept upstream's new rows AND fork's "Gallery server" branding
- **Risk**: LOW
- **Verification needed**: None — docs only

### Conflict: .github/workflows/auto-close.yml

- **Fork side**: Only `close_llm` job (template enforcement removed)
- **Upstream side**: Added `--repo "${{ github.repository }}"` flags to template enforcement jobs
- **Resolution**: Kept fork's version (only `close_llm`), discarded upstream's template enforcement updates
- **Risk**: LOW
- **Verification needed**: Auto-close workflow triggers correctly

### Conflict: Dart OpenAPI binary files (mobile/openapi/)

- **Multiple commits**: api.dart, api_client.dart, metadata_search_dto.dart, random_search_dto.dart, README.md
- **Resolution**: Took fork's version for all (these are generated files, will be regenerated)
- **Risk**: LOW
- **Verification needed**: `make open-api-dart` regenerates correctly

## Fork Feature Verification

| Feature              | Status | Notes                                                                                       |
| -------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Shared Spaces        | OK     | Services, controllers, schema, routes all present. Space access in access.repository intact |
| Storage Migration    | OK     | Service, controller, backend, admin routes present                                          |
| Pet Detection        | OK     | ML model, service, schema columns present                                                   |
| Image Editing        | OK     | Edit managers, RotateAction, media service extensions present                               |
| Branding             | OK     | Scripts, action, Docker integration present                                                 |
| Google Photos Import | OK     | Import manager, wizard components, routes present                                           |
| User Groups          | OK     | Service, controller, schema, components present                                             |
| Filter Panel         | OK     | All filter components, temporal picker, section selector present                            |
| Classification       | OK     | Service, controller, schema, components present                                             |
| Video Trimming       | OK     | Trim tool, manager, API endpoints present                                                   |

## CI and Infrastructure Verification

| Check                                               | Status | Notes                                                                            |
| --------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Workflow files (no upstream collisions)             | OK     | docker.yml correctly absent, release.yml present                                 |
| Docker image references (gallery-\*, not immich-\*) | OK     | Only expected upstream base image refs (postgres, mdq) remain                    |
| Branding (no "Immich" leaks in CI/config)           | FIXED  | Discussion template had "Immich" — updated to "Gallery"                          |
| Fork CI modifications intact (see table)            | OK     | DCM commented out, auto-close stripped, PR template deleted, release.yml renamed |
| New upstream workflows reviewed                     | OK     | No new workflows added in this batch                                             |
| Action/tool versions compatible                     | OK     | success-check-action updated to v0.0.5 (upstream change, compatible)             |

## Inconsistencies Found

1. **`asset.service.ts` stale import** — Our fork's `asset.service.ts` imported `assetViewingStore` from the deleted `asset-viewing.store.ts`. **Fixed**: Updated to use `assetViewerManager` from `asset-viewer-manager.svelte.ts`. Also updated the corresponding spec file mock.

2. **Discussion template branding** — `.github/DISCUSSION_TEMPLATE/feature-request.yaml` still referenced "Immich". **Fixed**: Updated to "Gallery".

## Code Review Findings

- All conflict resolutions are conservative and correct
- The `search.repository.ts` merge correctly combines upstream's empty-string filter with our fork's space scoping
- The `metadata.service.ts` resolution preserves both our `ensureLocalFile` wrapping and upstream's new extraction logic
- No upstream code was accidentally reverted in the fork diff

## Post-Rebase Verification

- Fork commits ahead of upstream: 138 (+ fixup commits pending)
- Commits behind upstream: 0
- Fork diff looks clean: YES
