# Upstream Sync Report — 2026-03-25

## Summary

- **Upstream commits pulled**: 20
- **Conflicts resolved**: 5
- **Risk level**: LOW
- **Upstream version**: v2.6.2
- **Recommendation**: PROCEED

## Incoming Upstream Changes

| SHA       | Summary                                       | Area       | Risk to Fork | Notes                                                     |
| --------- | --------------------------------------------- | ---------- | ------------ | --------------------------------------------------------- |
| a9666d2ce | Remove mobile upload timeout                  | mobile     | LOW          | No fork overlap                                           |
| 4af9edc20 | Update github-actions                         | CI         | LOW          | We keep our own workflows                                 |
| c975fe5bc | Update github-actions (major)                 | CI         | LOW          | We keep our own workflows                                 |
| 12a4d8e2e | Update mise docker tag                        | CI         | LOW          | No impact                                                 |
| ce9b32a61 | Version v2.6.2                                | all        | LOW          | Version bump in package.json files                        |
| 4ddc288cd | Album cover buttons consistency               | mobile/web | MEDIUM       | Touches album page `+page.svelte`, no overlap with spaces |
| 94b15b867 | Album permissions for editors                 | server     | LOW          | Touches `access.ts`, no overlap with space access         |
| ff9ae2421 | Album picker show all albums                  | web        | LOW          | No overlap                                                |
| b456f7877 | Clarify ML CPU docs                           | docs       | LOW          |                                                           |
| 150677689 | Mobile add cookie for auxiliary url           | mobile     | LOW          |                                                           |
| 0e93aa74c | Mobile add keys to people list                | mobile     | LOW          |                                                           |
| e95ad9d2e | Mobile option padding on search dropdowns     | mobile     | LOW          |                                                           |
| b98a227bb | Upload summary update when removing items     | web        | LOW          | No overlap                                                |
| 2dd785e3e | Restore duplicate viewer arrow key navigation | web        | LOW          | Touches duplicates page, no fork overlap                  |
| 7e754125c | Download original stale cache when edited     | web        | LOW          | Removed `getBaseUrl` import from `asset.service.ts`       |
| e2eb03d3a | Mobile star rating always defaults to 0       | mobile     | LOW          |                                                           |
| bf065a834 | Mobile no results before applying filter      | mobile     | LOW          |                                                           |
| db79173b5 | Vite 8 upgrade                                | web/cli    | MEDIUM       | Major dep upgrade, 781 lines in pnpm-lock.yaml            |
| 33666ccd2 | Mobile view similar photos from search        | mobile     | LOW          |                                                           |
| be93b9040 | Consolidate auto-close workflows              | CI         | LOW          | Deleted `check-pr-template.yml`, added `auto-close.yml`   |

### High-Risk Changes (detailed analysis)

**Vite 8 (`db79173b5`)**

- Upstream upgraded vite from v7 to v8 across web and CLI packages
- Changes: `web/package.json`, `cli/package.json`, `cli/vite.config.ts`, `pnpm-lock.yaml` (781 lines)
- Fork impact: Our web package.json has no vite customizations — we use the same build config as upstream
- Verified: The pnpm-lock.yaml was auto-resolved during rebase (take upstream's version)
- Risk mitigated by CI: web build + tests will catch any breakage

**Album cover buttons (`4ddc288cd`)**

- Touches `web/src/routes/(user)/albums/[albumId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Our fork doesn't modify the albums page — only spaces pages
- No conflict expected or encountered

## Conflict Resolutions

### Conflict 1: `.github/workflows/*` (10 files)

- **Fork side**: Our custom CI workflows (docker.yml, test.yml, etc.)
- **Upstream side**: Updated GitHub Actions versions, consolidated auto-close workflow
- **Resolution**: Keep ours for all CI workflows — we maintain our own CI pipeline
- **Risk**: LOW — our CI is independent of upstream's
- **Verification needed**: CI passes on the rebase branch

### Conflict 2: `web/src/lib/services/asset.service.ts`

- **Fork side**: Had `getBaseUrl` import (unused, leftover from earlier)
- **Upstream side**: Removed `getBaseUrl` import as part of download cache fix (#27195)
- **Resolution**: Took upstream's change (removed the import), kept our `removeAssetEdits` import
- **Risk**: LOW — `getBaseUrl` was not used in the file
- **Verification needed**: Web builds and tests pass

### Conflict 3: `.github/workflows/check-pr-template.yml` (modify/delete)

- **Fork side**: Had modifications to the PR template check workflow
- **Upstream side**: Deleted the file entirely (consolidated into `auto-close.yml`)
- **Resolution**: Deleted the file (follow upstream's consolidation)
- **Risk**: LOW — our fork has its own issue templates

### Conflict 4: `mobile/pubspec.yaml`

- **Fork side**: `version: 1.0.0+1` (our Play Store version)
- **Upstream side**: `version: 2.6.2+3040` (upstream version bump)
- **Resolution**: Kept ours (`1.0.0+1`) — this is our independent mobile versioning for the Play Store
- **Risk**: LOW — mobile version is fork-specific
- **Verification needed**: Mobile compiles

### Conflict 5: `mobile/openapi/README.md`

- **Fork side**: Our generated README with fork-specific API endpoints
- **Upstream side**: Updated README
- **Resolution**: Keep ours — regenerated during OpenAPI generation
- **Risk**: LOW — auto-generated file

## Fork Feature Verification

| Feature               | Status | Notes                                                                              |
| --------------------- | ------ | ---------------------------------------------------------------------------------- |
| Shared Spaces         | OK     | No upstream changes touch space-related files                                      |
| Storage Migration     | OK     | No upstream changes touch storage backend                                          |
| Pet Detection         | OK     | No upstream changes touch ML models                                                |
| Image Editing         | OK     | `asset.service.ts` conflict resolved cleanly — `removeAssetEdits` import preserved |
| Branding              | OK     | No upstream changes touch branding config                                          |
| Google Photos Import  | OK     | No upstream changes touch import wizard                                            |
| FilterPanel (/photos) | OK     | No upstream changes touch filter panel                                             |
| Contextual Filters    | OK     | No upstream changes touch search suggestions                                       |
| Unified Space Search  | OK     | No upstream changes touch space search                                             |

## Inconsistencies Found

None found. All fork imports resolve correctly. No renamed/moved modules in upstream that affect fork code.

## Post-Rebase Verification

- Fork commits ahead of upstream: 118
- Commits behind upstream: 0
- Fork diff looks clean: YES
- Server/web version: v2.6.2 (matches upstream)
- Mobile version: 1.0.0+1 (fork-specific, intentional)
