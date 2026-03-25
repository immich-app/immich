# Spaces Access Checks & Bulk Download by SpaceId

Design for fixing missing space access checks and adding bulk download support.

## Problem

Three gaps identified in the spaces permissions matrix:

1. `searchRandom` accepts `spaceId` via DTO but has no `requireAccess` guard — non-members can query
2. `searchLargeAssets` same issue
3. No way to bulk download all assets in a space by `spaceId`

## Methodology

All changes follow TDD with full unit test and E2E coverage. Tests are written first, then
implementation, then regression verification.

## Fix 1 & 2: Missing Access Checks

### What

Add `SharedSpaceRead` access guard to `searchRandom` and `searchLargeAssets` in
`server/src/services/search.service.ts`.

Both methods already propagate `spaceId` through their DTOs (`RandomSearchDto` and
`LargeAssetSearchDto` extend `BaseSearchDto` which includes `spaceId`) to the search repository.
The data path works — only the authorization guard is missing.

### Implementation

Add the standard 3-line guard (identical to `searchMetadata`, `searchSmart`,
`getSearchSuggestions`):

```typescript
if (dto.spaceId) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
}
```

### Unit Tests (`search.service.spec.ts`)

For each method, following the pattern at lines 244-295 (`getSearchSuggestions` space tests):

- Should check `SharedSpaceRead` when `spaceId` provided
- Should not check access when `spaceId` absent
- Should reject non-members (empty set from `checkMemberAccess`)

### E2E Tests (`shared-space.e2e-spec.ts`)

- Non-member calling `POST /search/random` with `spaceId` gets rejected
- Member calling `POST /search/random` with `spaceId` gets results scoped to space

## Fix 3: Bulk Download by SpaceId

### Approach

Add `spaceId` as another branch alongside `assetIds`/`albumId`/`userId` in the existing download
flow. This matches how album download already works — same endpoint, same chunking, same archive
flow.

### DTO (`server/src/dtos/download.dto.ts`)

Add `spaceId?: string` with `@ValidateUUID({ optional: true })` to `DownloadInfoDto`.

### Repository (`server/src/repositories/download.repository.ts`)

New `downloadSpaceId(spaceId)` method using JOIN-based UNION:

```typescript
downloadSpaceId(spaceId: string) {
  const direct = builder(this.db)
    .innerJoin('shared_space_asset', 'asset.id', 'shared_space_asset.assetId')
    .where('shared_space_asset.spaceId', '=', spaceId);

  const library = builder(this.db)
    .innerJoin('shared_space_library', (join) =>
      join.onRef('shared_space_library.libraryId', '=', 'asset.libraryId'))
    .where('shared_space_library.spaceId', '=', spaceId)
    .where('asset.isOffline', '=', false);

  return direct.union(library).stream();
}
```

Design decisions:

- **No `@GenerateSql`** — existing download repository methods don't use it; adding it here would
  be inconsistent
- **No visibility filter** — consistent with `downloadAlbumId`/`downloadUserId`; space assets are
  explicitly shared
- **`isOffline` on library branch only** — matches `getAssetIdsInSpace` pattern; direct assets were
  explicitly added (always relevant), library assets can be offline due to external storage
- **`UNION` not `UNION ALL`** — deduplicates assets that appear in both `shared_space_asset` and
  via `shared_space_library`
- **`deletedAt IS NULL`** — inherited from the shared `builder` function, consistent with all
  download methods

### Service (`server/src/services/download.service.ts`)

New branch in `getDownloadInfo()`:

```typescript
} else if (dto.spaceId) {
  const spaceId = dto.spaceId;
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [spaceId] });
  assets = this.downloadRepository.downloadSpaceId(spaceId);
}
```

Update error message: `'assetIds, albumId, userId, or spaceId is required'`

### Security Model

Two-layer authorization with no bypass path:

1. **Step 1** (`POST /download/info`): `SharedSpaceRead` check gates space asset enumeration. All
   space members (viewer/editor/owner) can download.
2. **Step 2** (`POST /download/archive`): Per-asset `AssetDownload` check. Space members already
   pass this via the space access chain in `access.ts` (`checkSpaceAccess`).

Shared links cannot access spaces (no `SharedSpaceRead` handler in shared link access) — this is
intentional and unchanged.

### Unit Tests (`download.service.spec.ts`)

Following the existing `albumId`/`userId` test patterns at lines 280-310:

- Should check `SharedSpaceRead` access when `spaceId` provided
- Should call `downloadSpaceId` with correct spaceId
- Should return chunked archive response
- Should reject non-members
- Error message should include `spaceId` as valid option

### E2E Tests (`shared-space.e2e-spec.ts` or `download.e2e-spec.ts`)

- Space owner downloads info with `spaceId` — gets correct asset list
- Space viewer downloads info with `spaceId` — allowed (all members can download)
- Non-member downloads info with `spaceId` — rejected
- Full archive download flow: create space, add assets, download archive, verify contents

E2E infrastructure already exists: `utils.createSpace`, `utils.addSpaceMember`,
`utils.addSpaceAssets`.

## Post-Implementation

- `make open-api` — DTO changed, regenerate TypeScript SDK
- Run all test suites sequentially to verify no regressions

## Not In Scope

- Dedicated space download endpoint (unnecessary duplication)
- New permission enum values (existing permissions suffice)
- Client/web UI for space download (separate concern)
- Explore data space-scoping (low priority known limitation)
