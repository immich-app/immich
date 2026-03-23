# Spaces Access Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three access control gaps where shared space members who don't own assets are denied functionality that works in albums.

**Architecture:** All three bugs stem from the same pattern — space access methods were modeled after album access but missed edge cases (live photos, owner-scoped queries). Fixes are server-only: access repository, search service/repository. No frontend changes needed.

**Tech Stack:** NestJS, Kysely, Vitest

**Reference:** See [spaces-permissions-matrix.md](2026-03-23-spaces-permissions-matrix.md) for the full permissions matrix showing all interactions across roles.

---

## Bug Summary

| #   | Bug                                                        | Root Cause                                                       | Files                                       |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| 1   | Live photo playback fails for non-owner space members      | `checkSpaceAccess()` doesn't check `livePhotoVideoId`            | `access.repository.ts`                      |
| 2   | Filter suggestions empty for non-owner space members       | `getExifField()` filters by `ownerId` even when `spaceId` is set | `search.repository.ts`, `search.service.ts` |
| 3   | `getSearchSuggestions()` has no access check for `spaceId` | Missing `requireAccess()` call                                   | `search.service.ts`                         |

---

## Task 1: Fix `checkSpaceAccess()` — add `livePhotoVideoId` support

**Files:**

- Modify: `server/src/repositories/access.repository.ts:218-255`
- Test: `server/src/utils/access.spec.ts`

### Step 1: Write failing tests

Add to `server/src/utils/access.spec.ts`. Inside the existing `AssetView` describe block (line 223), add a test that verifies the mock is called with the live photo video ID and returns it. Inside `AssetDownload` (line 255), add a parallel test. The mock-based unit tests validate wiring; the real behavior fix is in the repository SQL.

Add inside the `AssetView` describe block after line 252:

```typescript
it('should grant view access to a live photo motion video via space membership', async () => {
  const accessMock = newAccessRepositoryMock();
  const auth = makeAuth();
  const livePhotoVideoId = newUuid();

  accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([livePhotoVideoId]));

  const result = await checkAccess(accessMock as any, {
    auth,
    permission: Permission.AssetView,
    ids: new Set([livePhotoVideoId]),
  });

  expect(result).toEqual(new Set([livePhotoVideoId]));
  expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set([livePhotoVideoId]));
});
```

Add inside the `AssetDownload` describe block after line 284:

```typescript
it('should grant download access to a live photo motion video via space membership', async () => {
  const accessMock = newAccessRepositoryMock();
  const auth = makeAuth();
  const livePhotoVideoId = newUuid();

  accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([livePhotoVideoId]));

  const result = await checkAccess(accessMock as any, {
    auth,
    permission: Permission.AssetDownload,
    ids: new Set([livePhotoVideoId]),
  });

  expect(result).toEqual(new Set([livePhotoVideoId]));
  expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set([livePhotoVideoId]));
});
```

### Step 2: Run tests to verify they pass (mock-level tests pass by design)

```bash
cd server && pnpm test -- --run src/utils/access.spec.ts
```

Expected: PASS — these validate wiring, not the SQL.

### Step 3: Implement the fix in `checkSpaceAccess()`

In `server/src/repositories/access.repository.ts`, replace `checkSpaceAccess()` (lines 218-234) with:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
@ChunkedSet({ paramIndex: 1 })
async checkSpaceAccess(userId: string, assetIds: Set<string>) {
  if (assetIds.size === 0) {
    return new Set<string>();
  }

  return this.db
    .selectFrom('shared_space_asset')
    .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
    .innerJoin('asset', (join) =>
      join.onRef('asset.id', '=', 'shared_space_asset.assetId').on('asset.deletedAt', 'is', null),
    )
    .select(['asset.id', 'asset.livePhotoVideoId'])
    .where('shared_space_member.userId', '=', userId)
    .where((eb) =>
      eb.or([
        eb('asset.id', 'in', [...assetIds]),
        eb('asset.livePhotoVideoId', 'in', [...assetIds]),
      ]),
    )
    .execute()
    .then((assets) => {
      const allowedIds = new Set<string>();
      for (const asset of assets) {
        if (asset.id && assetIds.has(asset.id)) {
          allowedIds.add(asset.id);
        }
        if (asset.livePhotoVideoId && assetIds.has(asset.livePhotoVideoId)) {
          allowedIds.add(asset.livePhotoVideoId);
        }
      }
      return allowedIds;
    });
}
```

This adds `livePhotoVideoId` handling that `checkAlbumAccess()` has (lines 133-170). Note: `checkAlbumAccess` uses a CTE (`with('target', ...)`) + `any(target.ids)` pattern while `checkSpaceAccess` uses `where('in', [...assetIds])`. Both achieve the same result — the `IN` pattern is simpler and consistent with the existing `checkSpaceAccess` style.

### Step 4: Apply the same fix to `checkSpaceEditAccess()`

Replace `checkSpaceEditAccess()` (lines 238-255) with the same `livePhotoVideoId` pattern, keeping the `role` filter:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
@ChunkedSet({ paramIndex: 1 })
async checkSpaceEditAccess(userId: string, assetIds: Set<string>) {
  if (assetIds.size === 0) {
    return new Set<string>();
  }

  return this.db
    .selectFrom('shared_space_asset')
    .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
    .innerJoin('asset', (join) =>
      join.onRef('asset.id', '=', 'shared_space_asset.assetId').on('asset.deletedAt', 'is', null),
    )
    .select(['asset.id', 'asset.livePhotoVideoId'])
    .where('shared_space_member.userId', '=', userId)
    .where((eb) =>
      eb.or([
        eb('asset.id', 'in', [...assetIds]),
        eb('asset.livePhotoVideoId', 'in', [...assetIds]),
      ]),
    )
    .where('shared_space_member.role', 'in', ['editor', 'owner'])
    .execute()
    .then((assets) => {
      const allowedIds = new Set<string>();
      for (const asset of assets) {
        if (asset.id && assetIds.has(asset.id)) {
          allowedIds.add(asset.id);
        }
        if (asset.livePhotoVideoId && assetIds.has(asset.livePhotoVideoId)) {
          allowedIds.add(asset.livePhotoVideoId);
        }
      }
      return allowedIds;
    });
}
```

### Step 5: Run tests

```bash
cd server && pnpm test -- --run src/utils/access.spec.ts
```

Expected: PASS

### Step 6: Regenerate SQL queries

```bash
make sql
```

This updates `server/src/queries/access.repository.sql` with the new query.

### Step 7: Commit

```bash
git add server/src/repositories/access.repository.ts server/src/queries/access.repository.sql server/src/utils/access.spec.ts
git commit -m "fix(server): add livePhotoVideoId support to space access checks

checkSpaceAccess and checkSpaceEditAccess now handle live photo video
IDs, matching the pattern used by checkAlbumAccess. This fixes playback
of motion/live photos for non-owner space members."
```

---

## Task 2: Fix `getSearchSuggestions()` — add access check and fix owner filter

**Files:**

- Modify: `server/src/services/search.service.ts:162-168`
- Modify: `server/src/repositories/search.repository.ts:518-542`
- Test: `server/src/services/search.service.spec.ts`

### Step 1: Write failing tests

Add a new `describe('shared space access (spaceId)')` block inside the `getSearchSuggestions` describe block in `server/src/services/search.service.spec.ts`, after line 240. Follow the exact pattern used by `searchMetadata` (lines 479-520) and `searchSmart` (lines 377-411):

```typescript
describe('shared space access (spaceId)', () => {
  it('should check shared space access when spaceId is provided', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
    mocks.search.getCountries.mockResolvedValue(['Germany']);

    await sut.getSearchSuggestions(authStub.user1, {
      type: SearchSuggestionType.COUNTRY,
      spaceId,
    });

    expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.user1.user.id, new Set([spaceId]));
  });

  it('should pass spaceId through to search repository', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
    mocks.search.getCountries.mockResolvedValue(['Germany']);

    await sut.getSearchSuggestions(authStub.user1, {
      type: SearchSuggestionType.COUNTRY,
      spaceId,
    });

    expect(mocks.search.getCountries).toHaveBeenCalledWith(expect.anything(), { spaceId });
  });

  it('should not check space access when spaceId is not provided', async () => {
    mocks.search.getCountries.mockResolvedValue(['Germany']);

    await sut.getSearchSuggestions(authStub.user1, {
      type: SearchSuggestionType.COUNTRY,
    });

    expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
  });

  it('should throw when user is not a space member', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

    await expect(
      sut.getSearchSuggestions(authStub.user1, {
        type: SearchSuggestionType.COUNTRY,
        spaceId,
      }),
    ).rejects.toThrow();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd server && pnpm test -- --run src/services/search.service.spec.ts
```

Expected: FAIL — "should throw when user is not a space member" will not throw because there's no access check. The other three new tests will also fail because the access check doesn't exist yet.

### Step 3: Fix `getSearchSuggestions()` in search.service.ts

Replace the method (lines 162-168):

```typescript
async getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto) {
  if (dto.spaceId) {
    await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
  }

  const userIds = await this.getUserIdsToSearch(auth);
  const suggestions = await this.getSuggestions(userIds, dto);
  if (dto.includeNull) {
    suggestions.push(null);
  }
  return suggestions;
}
```

### Step 4: Fix existing spaceId tests that will now break

The existing tests at lines 211-240 (`should pass spaceId to country search suggestions` and `should pass spaceId to state search suggestions`) pass `spaceId` but don't mock `checkMemberAccess`. After adding the `requireAccess()` call, the default mock returns an empty set (= access denied = throws). Add `mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));` to each:

```typescript
it('should pass spaceId to country search suggestions', async () => {
  const spaceId = newUuid();
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.search.getCountries.mockResolvedValue(['Germany']);
  mocks.partner.getAll.mockResolvedValue([]);

  const result = await sut.getSearchSuggestions(authStub.user1, {
    type: SearchSuggestionType.COUNTRY,
    spaceId,
  });

  expect(result).toEqual(['Germany']);
  expect(mocks.search.getCountries).toHaveBeenCalledWith([authStub.user1.user.id], { spaceId });
});

it('should pass spaceId to state search suggestions', async () => {
  const spaceId = newUuid();
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.search.getStates.mockResolvedValue(['Bavaria']);
  mocks.partner.getAll.mockResolvedValue([]);

  const result = await sut.getSearchSuggestions(authStub.user1, {
    type: SearchSuggestionType.STATE,
    spaceId,
  });

  expect(result).toEqual(['Bavaria']);
  expect(mocks.search.getStates).toHaveBeenCalledWith([authStub.user1.user.id], expect.objectContaining({ spaceId }));
});
```

### Step 5: Run tests to verify they pass

```bash
cd server && pnpm test -- --run src/services/search.service.spec.ts
```

Expected: PASS

### Step 6: Fix `getExifField()` owner filter in search.repository.ts

The `getExifField()` method (lines 518-542) currently always filters by `ownerId`. When `spaceId` is provided, the `shared_space_asset` EXISTS subquery already scopes results to the correct assets — the `ownerId` filter incorrectly excludes assets from other space members.

Replace the method:

```typescript
private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel'>(
  field: K,
  userIds: string[],
  options?: SpaceScopeOptions,
) {
  return this.db
    .selectFrom('asset_exif')
    .select(field)
    .distinctOn(field)
    .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
    .$if(!options?.spaceId, (qb) => qb.where('ownerId', '=', anyUuid(userIds)))
    .where('visibility', '=', AssetVisibility.Timeline)
    .where('deletedAt', 'is', null)
    .where(field, 'is not', null)
    .$if(!!options?.spaceId, (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_asset')
            .whereRef('shared_space_asset.assetId', '=', 'asset.id')
            .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
        ),
      ),
    );
}
```

Key change: `.$if(!options?.spaceId, ...)` — only apply the `ownerId` filter when NOT scoped to a space. When scoped to a space, the `shared_space_asset` EXISTS subquery provides the correct scoping.

**Design note on visibility:** The `visibility = Timeline` filter is intentionally kept even for space-scoped queries. Space assets should still be visible (not archived/trashed). This matches how `searchAssetBuilder()` in `server/src/utils/database.ts` handles space queries.

### Step 7: Run all search tests

```bash
cd server && pnpm test -- --run src/services/search.service.spec.ts
```

Expected: PASS

### Step 8: Regenerate SQL queries

```bash
make sql
```

### Step 9: Commit

```bash
git add server/src/services/search.service.ts server/src/services/search.service.spec.ts server/src/repositories/search.repository.ts server/src/queries/search.repository.sql
git commit -m "fix(server): add access check and fix owner filter for space search suggestions

getSearchSuggestions now validates SharedSpaceRead permission when
spaceId is provided. getExifField skips the ownerId filter when scoped
to a space, allowing non-owner members to see filter options for all
assets in the space."
```

---

## Task 3: E2E tests for space access fixes

**Files:**

- Modify: `e2e/src/specs/server/api/search.e2e-spec.ts`

The existing search e2e tests (lines 858-928) only test with `admin` who is also the asset owner. We need tests for:

- Non-owner member seeing filter suggestions from other users' assets
- Non-member being rejected when providing a spaceId

### Step 1: Add e2e tests for non-owner space member suggestions

Add a second user and test that they can see suggestions for assets they don't own. Add inside the existing `describe('GET /search/suggestions (spaceId scoping)')` block, after the `beforeAll`:

First, in the `beforeAll` block, add a second user, add them as a space member, and verify they see the asset owner's EXIF data:

```typescript
let nonOwnerUser: LoginResponseDto;

// Inside the existing beforeAll, after space creation:
nonOwnerUser = await utils.userSetup(admin.accessToken, {
  email: 'space-filter-test@immich.cloud',
  name: 'Space Filter User',
  password: 'Password123!',
});
await utils.addSpaceMember(admin.accessToken, space.id, { userId: nonOwnerUser.userId, role: 'viewer' });
```

Then add new tests:

```typescript
it('should return suggestions for non-owner space member', async () => {
  // nonOwnerUser doesn't own the Paris asset, but is a space member
  const { status, body } = await request(app)
    .get(`/search/suggestions?type=country&spaceId=${space.id}`)
    .set('Authorization', `Bearer ${nonOwnerUser.accessToken}`);
  expect(status).toBe(200);
  expect(body).toEqual(['France']);
});

it('should return camera suggestions for non-owner space member', async () => {
  const { status, body } = await request(app)
    .get(`/search/suggestions?type=camera-make&spaceId=${space.id}`)
    .set('Authorization', `Bearer ${nonOwnerUser.accessToken}`);
  expect(status).toBe(200);
  expect(body).toEqual(['Canon']);
});

it('should reject non-member requesting space suggestions', async () => {
  const outsider = await utils.userSetup(admin.accessToken, {
    email: 'space-outsider@immich.cloud',
    name: 'Outsider',
    password: 'Password123!',
  });
  const { status } = await request(app)
    .get(`/search/suggestions?type=country&spaceId=${space.id}`)
    .set('Authorization', `Bearer ${outsider.accessToken}`);
  expect(status).toBe(400);
});
```

### Step 2: Run e2e tests

```bash
cd e2e && pnpm test -- --run src/specs/server/api/search.e2e-spec.ts
```

Note: E2E tests require the Docker test stack (`make e2e`). If not available, skip this step and let CI run it.

### Step 3: Commit

```bash
git add e2e/src/specs/server/api/search.e2e-spec.ts
git commit -m "test(e2e): add space access tests for search suggestions

Tests non-owner member seeing filter suggestions, and non-member
being rejected when querying with spaceId."
```

---

## Task 4: Run full test suite and lint

### Step 1: Run server unit tests

```bash
cd server && pnpm test
```

Expected: PASS

### Step 2: Lint and format

```bash
make lint-server && make format-server && make check-server
```

Expected: PASS

### Step 3: Commit any formatting changes

If formatting changed anything:

```bash
git add server/ e2e/ && git commit -m "chore: format"
```

---

## Task 5: Create PR and babysit

### Step 1: Create PR

Create a PR to main with title: "fix(server): fix space access for live photos and search filters"

Body should summarize the three fixes with the bug summary table from above.

### Step 2: Babysit CI

Use `/babysit` to watch CI until green.

---

## Edge Cases Considered

| Edge Case                                                    | Decision                               | Reasoning                                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Live photo video not directly in `shared_space_asset`        | Handled by `livePhotoVideoId` JOIN     | The still photo IS in the space; `checkSpaceAccess` now resolves the linked video via `asset.livePhotoVideoId`, same as `checkAlbumAccess` |
| `visibility` filter in space-scoped `getExifField`           | Keep `AssetVisibility.Timeline` filter | Space assets should still be visible (not archived/trashed). Matches `searchAssetBuilder()` pattern                                        |
| `ownerId` filter removal causing over-scoping                | Safe                                   | The `shared_space_asset` EXISTS subquery provides equivalent scoping — only assets in the space are returned                               |
| `checkSpaceEditAccess` + livePhotoVideoId                    | Fixed in parallel                      | Same pattern needed for consistency, even though edit access for live video is less common                                                 |
| Non-member with spaceId in suggestions                       | Rejected by `requireAccess()`          | Returns 400 error, same as `searchMetadata` and `searchSmart`                                                                              |
| `getUserIdsToSearch()` called unnecessarily when spaceId set | Accept for now                         | `userIds` is passed to `getExifField` but ignored when `spaceId` is set. Avoiding the partner query is a future optimization, not a bug    |
