# Space Timeline Opt-In Identity Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `shared_space_member.showInTimeline` the single opt-in gate for shared-space assets, people, album scope, map scope, and metadata inheritance outside explicit `spaceId` pages.

**Architecture:** Keep explicit space scope unchanged. For every global or album-scoped path, compute the viewer's own/partner user IDs and timeline-enabled space IDs, then intersect assets and people with that scope. Album rows do not bypass this scope; they only add an album filter inside it.

**Tech Stack:** TypeScript, NestJS services, Kysely repositories, generated SQL snapshots, Vitest medium tests.

---

## File Structure

- Modify `server/test/medium/specs/services/people-identity-rbac.spec.ts`
  - Add red/green coverage for album-scoped people/search suggestions, direct assets, linked libraries, explicit space fallback, and viewer-owned identity filters.
- Modify `server/src/services/search.service.spec.ts`
  - Add small service coverage that album-scoped search methods resolve timeline-enabled space IDs and validate scoped people tokens as global shared-space scope.
- Modify `server/test/medium/specs/services/shared-space-person-metadata-rbac.spec.ts`
  - Add red/green coverage for disabling then re-enabling `showInTimeline` as a reversible metadata source gate.
- Modify `server/test/medium/specs/repositories/map.repository.spec.ts`
  - Add repository-level coverage for album assets that are direct shared-space assets and linked-library assets.
- Modify `server/src/services/map.service.spec.ts`
  - Add service-level coverage that `withSharedAlbums=true` resolves timeline-enabled space IDs.
- Modify `server/src/services/album.service.spec.ts`
  - Add service-level coverage that album map markers are requested with owner/partner IDs and timeline-enabled spaces for logged-in users, while shared-link album map behavior stays unchanged.
- Modify `server/src/services/search.service.ts`
  - Resolve timeline-enabled space IDs for album asset searches, not only `withSharedSpaces`.
- Modify `server/src/repositories/search.repository.ts`
  - Apply owner/partner/timeline space scope even when `albumId` is present for filter and search suggestions.
- Modify `server/src/repositories/map.repository.ts`
  - Scope album map assets to owner/partner assets or timeline-enabled spaces.
- Modify `server/src/services/map.service.ts`
  - Resolve timeline-enabled spaces when shared albums are included.
- Modify `server/src/services/album.service.ts`
  - Pass album map scope into `MapRepository.getAlbumMapMarkers`.
- Regenerate `server/src/queries/search.repository.sql` and `server/src/queries/map.repository.sql`.

---

## Task 1: Red Tests for Album and Global People Scope

**Files:**

- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `server/src/services/search.service.spec.ts`

- [ ] **Step 1: Add helper functions near `authFor`**

Add this code after `authFor`:

```ts
const setSpaceTimeline = async (
  ctx: ReturnType<typeof setup>['ctx'],
  input: { spaceId: string; userId: string; showInTimeline: boolean },
) => {
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: input.showInTimeline })
    .where('spaceId', '=', input.spaceId)
    .where('userId', '=', input.userId)
    .execute();
};

const addCity = async (ctx: ReturnType<typeof setup>['ctx'], assetId: string, city: string) => {
  await ctx.newExif({ assetId, city, country: 'Germany', fileSizeInByte: 2048 });
};
```

- [ ] **Step 2: Write failing direct-space album test**

Add this test inside `describe('People identity RBAC projection', () => { ... })` near the existing album filter tests:

```ts
it('timeline opt-in: album scope excludes direct space people and assets while the space is hidden from timeline', async () => {
  const { ctx, sut } = setupSearch();
  const faceIdentityRepository = ctx.get(FaceIdentityRepository);
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Space Album Name' });
  const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  await addCity(ctx, asset.id, 'Hamburg');
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
  const { album } = await ctx.newAlbum({ ownerId: member.id });
  await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
  const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
  await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      name: 'Space Album Name',
      representativeFaceId: faceId,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: faceId })
    .execute();

  const auth = authFor(member);
  await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

  const albumFiltersHidden = await sut.getFilterSuggestions(auth, { albumId: album.id });
  const albumCitiesHidden = await sut.getSearchSuggestions(auth, {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
    personIds: [`space-person:${spacePerson.id}`],
  });
  const albumAssetsHidden = await sut.searchMetadata(auth, { albumIds: [album.id] });
  const albumStatsHidden = await sut.searchStatistics(auth, { albumIds: [album.id] });
  const albumRandomHidden = await sut.searchRandom(auth, { albumIds: [album.id], size: 10 });
  const albumLargeHidden = await sut.searchLargeAssets(auth, { albumIds: [album.id], minFileSize: 1 });
  const explicitSpaceFilters = await sut.getFilterSuggestions(auth, { spaceId: space.id });
  const explicitSpaceAssets = await sut.searchMetadata(auth, { spaceId: space.id });

  expect(albumFiltersHidden.people).toEqual([]);
  expect(albumCitiesHidden).toEqual([]);
  expect(albumAssetsHidden.assets.items).toEqual([]);
  expect(albumStatsHidden.total).toBe(0);
  expect(albumRandomHidden).toEqual([]);
  expect(albumLargeHidden).toEqual([]);
  expect(JSON.stringify({ albumFiltersHidden, albumCitiesHidden, albumAssetsHidden })).not.toContain(
    'Space Album Name',
  );
  expect(explicitSpaceFilters.people).toEqual([
    {
      id: spacePerson.id,
      name: 'Space Album Name',
      primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
    },
  ]);
  expect(explicitSpaceAssets.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);

  await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });

  const albumFiltersVisible = await sut.getFilterSuggestions(auth, { albumId: album.id });
  const albumCitiesVisible = await sut.getSearchSuggestions(auth, {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
    personIds: [`space-person:${spacePerson.id}`],
  });
  const albumAssetsVisible = await sut.searchMetadata(auth, { albumIds: [album.id] });
  const albumStatsVisible = await sut.searchStatistics(auth, { albumIds: [album.id] });
  const albumRandomVisible = await sut.searchRandom(auth, { albumIds: [album.id], size: 10 });
  const albumLargeVisible = await sut.searchLargeAssets(auth, { albumIds: [album.id], minFileSize: 1 });

  expect(albumFiltersVisible.people).toEqual([
    {
      id: `space-person:${spacePerson.id}`,
      name: 'Space Album Name',
      primaryProfile: { type: 'space-person', id: spacePerson.id, spaceId: space.id },
    },
  ]);
  expect(albumCitiesVisible).toEqual(['Hamburg']);
  expect(albumAssetsVisible.assets.items).toEqual([expect.objectContaining({ id: asset.id })]);
  expect(albumStatsVisible.total).toBe(1);
  expect(albumRandomVisible).toEqual([expect.objectContaining({ id: asset.id })]);
  expect(albumLargeVisible).toEqual([expect.objectContaining({ id: asset.id })]);
});
```

- [ ] **Step 3: Write failing linked-library album test**

Add this test after the direct-space album test:

```ts
it('timeline opt-in: album scope excludes linked-library people and assets while the space is hidden from timeline', async () => {
  const fx = await createLinkedLibraryIdentityFixture({ city: 'Zurich' });
  const { album } = await fx.ctx.newAlbum({ ownerId: fx.member.id });
  await fx.ctx.newAlbumAsset({ albumId: album.id, assetId: fx.face.asset.id });
  const auth = authFor(fx.member);
  const token = `space-person:${fx.spacePerson.id}`;

  await fx.sharedSpaceService.updateMemberTimeline(auth, fx.space.id, { showInTimeline: false });

  const filtersHidden = await fx.searchService.getFilterSuggestions(auth, { albumId: album.id });
  const citiesHidden = await fx.searchService.getSearchSuggestions(auth, {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
    personIds: [token],
  });
  const assetsHidden = await fx.searchService.searchMetadata(auth, { albumIds: [album.id] });
  const statsHidden = await fx.searchService.searchStatistics(auth, { albumIds: [album.id] });
  const explicitSpaceAssets = await fx.searchService.searchMetadata(auth, { spaceId: fx.space.id });

  expect(filtersHidden.people).toEqual([]);
  expect(citiesHidden).toEqual([]);
  expect(assetsHidden.assets.items).toEqual([]);
  expect(statsHidden.total).toBe(0);
  expect(JSON.stringify({ filtersHidden, citiesHidden, assetsHidden })).not.toContain('Library Source');
  expect(explicitSpaceAssets.assets.items).toEqual([expect.objectContaining({ id: fx.face.asset.id })]);

  await fx.sharedSpaceService.updateMemberTimeline(auth, fx.space.id, { showInTimeline: true });

  const filtersVisible = await fx.searchService.getFilterSuggestions(auth, { albumId: album.id });
  const citiesVisible = await fx.searchService.getSearchSuggestions(auth, {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
    personIds: [token],
  });
  const assetsVisible = await fx.searchService.searchMetadata(auth, { albumIds: [album.id] });
  const statsVisible = await fx.searchService.searchStatistics(auth, { albumIds: [album.id] });

  expect(filtersVisible.people).toEqual([
    {
      id: token,
      name: 'Library Source',
      primaryProfile: { type: 'space-person', id: fx.spacePerson.id, spaceId: fx.space.id },
    },
  ]);
  expect(citiesVisible).toEqual(['Zurich']);
  expect(assetsVisible.assets.items).toEqual([expect.objectContaining({ id: fx.face.asset.id })]);
  expect(statsVisible.total).toBe(1);
});
```

- [ ] **Step 4: Write stale album token leakage test**

Add this test after the linked-library album test:

```ts
it('timeline opt-in: album scoped stale space-person token cannot broaden results from a hidden space', async () => {
  const { ctx, sut } = setupSearch();
  const faceIdentityRepository = ctx.get(FaceIdentityRepository);
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Hidden Token Name' });
  const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  await addCity(ctx, asset.id, 'Cologne');
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
  const { album } = await ctx.newAlbum({ ownerId: member.id });
  await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
  const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
  await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      name: 'Hidden Token Name',
      representativeFaceId: faceId,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: faceId })
    .execute();
  await setSpaceTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

  const hidden = await sut.searchMetadata(authFor(member), {
    albumIds: [album.id],
    personIds: [`space-person:${spacePerson.id}`],
  });
  const cities = await sut.getSearchSuggestions(authFor(member), {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
    personIds: [`space-person:${spacePerson.id}`],
  });

  expect(hidden.assets.items).toEqual([]);
  expect(cities).toEqual([]);
});
```

Expected failure before implementation: `resolveScopedPersonTokens` currently treats album-scoped `space-person:` tokens as local member access, so hidden-space tokens may resolve instead of forcing an empty result.

- [ ] **Step 5: Write shared-album non-member RBAC test**

Add this test after the stale token test:

```ts
it('timeline opt-in: album sharing does not re-share a shared-space-only person to a non-member', async () => {
  const { ctx, sut } = setupSearch();
  const faceIdentityRepository = ctx.get(FaceIdentityRepository);
  const { user: owner } = await ctx.newUser();
  const { user: spaceMember } = await ctx.newUser();
  const { user: albumViewer } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: spaceMember.id, role: SharedSpaceRole.Viewer });
  const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'No Reshare Name' });
  const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  await addCity(ctx, asset.id, 'Munich');
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
  const { album } = await ctx.newAlbum({ ownerId: spaceMember.id });
  await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });
  await ctx.newAlbumUser({ albumId: album.id, userId: albumViewer.id });
  const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
  await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      name: 'No Reshare Name',
      representativeFaceId: faceId,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: faceId })
    .execute();

  const filters = await sut.getFilterSuggestions(authFor(albumViewer), { albumId: album.id });
  const metadata = await sut.searchMetadata(authFor(albumViewer), { albumIds: [album.id] });
  const cities = await sut.getSearchSuggestions(authFor(albumViewer), {
    type: SearchSuggestionType.CITY,
    albumId: album.id,
  });

  expect(filters.people).toEqual([]);
  expect(metadata.assets.items).toEqual([]);
  expect(cities).toEqual([]);
  expect(JSON.stringify({ filters, metadata, cities })).not.toContain('No Reshare Name');
});
```

This protects the default-no re-share rule from the design doc: `AlbumRead` alone must not expose source-space assets or names to a viewer who is not a member of that source space.

- [ ] **Step 6: Write per-viewer independence test**

Add this test after the shared-album non-member test:

```ts
it('timeline opt-in: disabling a space is per viewer and does not hide it for another member', async () => {
  const { ctx, sut } = setupSearch();
  const faceIdentityRepository = ctx.get(FaceIdentityRepository);
  const { user: owner } = await ctx.newUser();
  const { user: hiddenMember } = await ctx.newUser();
  const { user: visibleMember } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: hiddenMember.id, role: SharedSpaceRole.Viewer });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: visibleMember.id, role: SharedSpaceRole.Viewer });
  const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Viewer Scoped Name' });
  const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
  const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await faceIdentityRepository.ensurePersonIdentity(person.id);
  await faceIdentityRepository.linkFace({ assetFaceId: faceId, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      name: 'Viewer Scoped Name',
      representativeFaceId: faceId,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: faceId })
    .execute();
  await setSpaceTimeline(ctx, { spaceId: space.id, userId: hiddenMember.id, showInTimeline: false });

  const hidden = await sut.searchPerson(authFor(hiddenMember), { name: 'Viewer', withSharedSpaces: true });
  const visible = await sut.searchPerson(authFor(visibleMember), { name: 'Viewer', withSharedSpaces: true });

  expect(hidden).toEqual([]);
  expect(visible).toHaveLength(1);
});
```

- [ ] **Step 7: Write viewer-owned identity filter test**

Add this test after the linked-library album test:

```ts
it('timeline opt-in: a viewer-owned identity token does not pull matching photos from a hidden space', async () => {
  const { ctx, faceIdentityRepository } = setup();
  const { sut: searchService } = setupSearch();
  const { sut: sharedSpaceService } = setupSharedSpace();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  const ownerFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
    ownerId: owner.id,
    personName: 'Owner John',
    spaceId: space.id,
  });
  const memberFace = await createIdentityBackedFace(ctx, faceIdentityRepository, {
    ownerId: member.id,
    personName: 'Member John',
  });
  await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: ownerFace.asset.id });
  await faceIdentityRepository.mergeIdentities({
    targetIdentityId: memberFace.identity.id,
    sourceIdentityIds: [ownerFace.identity.id],
    source: 'manual',
  });
  const auth = authFor(member);
  await sharedSpaceService.updateMemberTimeline(auth, space.id, { showInTimeline: false });

  const filtered = await searchService.searchMetadata(auth, {
    withSharedSpaces: true,
    personIds: [`person:${memberFace.person.id}`],
  });

  expect(filtered.assets.items).toEqual([expect.objectContaining({ id: memberFace.asset.id })]);
  expect(filtered.assets.items.map((asset) => asset.id)).not.toContain(ownerFace.asset.id);
});
```

- [ ] **Step 8: Add small SearchService scope tests**

In `server/src/services/search.service.spec.ts`, add tests in the existing `getSearchSuggestions`, `searchMetadata`, `searchStatistics`, `searchRandom`, `searchLargeAssets`, `getFilterSuggestions`, and `searchSmart` describe blocks:

```ts
it('checks album access and passes timelineSpaceIds to getSearchSuggestions', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
  mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([albumId]));
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.getCountries.mockResolvedValue(['Germany']);

  await sut.getSearchSuggestions(authStub.user1, { type: SearchSuggestionType.COUNTRY, albumId });

  expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.user1.user.id);
  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ albumId, timelineSpaceIds: [spaceId] }),
  );
});
```

Add these concrete tests in the corresponding method describe blocks:

```ts
it('passes timelineSpaceIds for album-scoped searchMetadata', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

  await sut.searchMetadata(authStub.user1, { albumIds: [albumId] });

  expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.user1.user.id);
  expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ albumIds: [albumId], timelineSpaceIds: [spaceId] }),
  );
});

it('passes timelineSpaceIds for album-scoped searchStatistics', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.searchStatistics.mockResolvedValue({ total: 0 } as any);

  await sut.searchStatistics(authStub.user1, { albumIds: [albumId] });

  expect(mocks.search.searchStatistics).toHaveBeenCalledWith(
    expect.objectContaining({ albumIds: [albumId], timelineSpaceIds: [spaceId] }),
  );
});

it('passes timelineSpaceIds for album-scoped searchRandom', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.searchRandom.mockResolvedValue([]);

  await sut.searchRandom(authStub.user1, { albumIds: [albumId] });

  expect(mocks.search.searchRandom).toHaveBeenCalledWith(
    250,
    expect.objectContaining({ albumIds: [albumId], timelineSpaceIds: [spaceId] }),
  );
});

it('passes timelineSpaceIds for album-scoped searchLargeAssets', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.searchLargeAssets.mockResolvedValue([]);

  await sut.searchLargeAssets(authStub.user1, { albumIds: [albumId] });

  expect(mocks.search.searchLargeAssets).toHaveBeenCalledWith(
    250,
    expect.objectContaining({ albumIds: [albumId], timelineSpaceIds: [spaceId] }),
  );
});
```

Add this scoped-token test in the existing `getFilterSuggestions` describe block:

```ts
it('validates album scoped space-person tokens using timeline-enabled shared-space scope', async () => {
  const auth = AuthFactory.create();
  const albumId = newUuid();
  const spaceId = newUuid();
  const token = `space-person:${newUuid()}`;
  mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.search.getFilterSuggestions.mockResolvedValue(emptyResult);
  (mocks.faceIdentity as any).resolveScopedPersonTokens.mockResolvedValue({
    identityIds: [],
    legacyPersonIds: [],
    legacySpacePersonIds: [],
    hasInaccessibleToken: true,
  });

  await sut.getFilterSuggestions(auth, { albumId, personIds: [token] });

  expect((mocks.faceIdentity as any).resolveScopedPersonTokens).toHaveBeenCalledWith({
    userId: auth.user.id,
    tokens: [token],
    scope: { withSharedSpaces: true, timelineSpaceIds: [spaceId], spaceId: undefined },
  });
  expect(mocks.search.getFilterSuggestions).toHaveBeenCalledWith(
    [auth.user.id],
    expect.objectContaining({ forceEmptyResult: true }),
  );
});
```

Add this smart-search service test in the existing `searchSmart` shared-space describe block:

```ts
it('fetches timeline space IDs when albumIds are set for smart search', async () => {
  const albumId = newUuid();
  const spaceId = newUuid();
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);

  await sut.searchSmart(authStub.user1, { query: 'test', albumIds: [albumId] });

  expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.user1.user.id);
  expect(mocks.search.searchSmart).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ albumIds: [albumId], timelineSpaceIds: [spaceId] }),
  );
});
```

- [ ] **Step 9: Run red test command**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/services/people-identity-rbac.spec.ts --run -t "timeline opt-in"
pnpm --dir server test -- --run server/src/services/search.service.spec.ts
```

Expected: FAIL. The direct and linked-library album tests should expose that `albumId`/`albumIds` paths do not consistently intersect with timeline-enabled spaces.

---

## Task 2: Implement Search and Filter Timeline Scope

**Files:**

- Modify: `server/src/services/search.service.ts`
- Modify: `server/src/repositories/search.repository.ts`
- Generated: `server/src/queries/search.repository.sql`

- [ ] **Step 1: Resolve timeline spaces for album asset and suggestion searches**

In `server/src/services/search.service.ts`, update the methods that call `getTimelineSpaceIds` for asset searches:

```ts
const timelineSpaceIds = await this.getTimelineSpaceIds(auth, dto.withSharedSpaces || !!dto.albumIds?.length);
```

Apply that exact expression in:

- `searchMetadata`
- `searchStatistics`
- `searchRandom`
- `searchLargeAssets`

In `getSearchSuggestions`, change:

```ts
if (!dto.albumId && dto.withSharedSpaces) {
```

to:

```ts
if (dto.withSharedSpaces || dto.albumId) {
```

Keep the existing `albumId` + `withSharedSpaces` rejection. `albumId` means "global viewer scope filtered by album", so it still needs timeline-enabled space IDs for the viewer.

In `resolveSmartSearch`, change the condition to:

```ts
if (dto.withSharedSpaces || !!dto.albumIds?.length) {
  const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
  if (spaceRows.length > 0) {
    timelineSpaceIds = spaceRows.map((row) => row.spaceId);
  }
}
```

- [ ] **Step 2: Treat album person-token resolution as global shared-space scope**

In `server/src/services/search.service.ts`, extend `ScopedPersonFilterOptions`:

```ts
type ScopedPersonFilterOptions = {
  personIds?: string[];
  identityIds?: string[];
  spacePersonIds?: string[];
  forceEmptyResult?: boolean;
  withSharedSpaces?: boolean;
  spaceId?: string;
  albumId?: string;
  albumIds?: string[];
  timelineSpaceIds?: string[];
};
```

In `resolveScopedPersonFilters`, compute an album-aware global scope:

```ts
const isGlobalSharedScope = dto.withSharedSpaces || !!dto.albumId || !!dto.albumIds?.length;
const shouldResolve = tokens.length > 0 && (isGlobalSharedScope || hasScopedTokens);
```

Then pass the same album-aware flag into the repository token resolver:

```ts
scope: {
  withSharedSpaces: isGlobalSharedScope,
  timelineSpaceIds: dto.timelineSpaceIds,
  spaceId: dto.spaceId,
},
```

This is the critical stale-token protection: a `space-person:` token in album scope must be inaccessible unless that source space is in the viewer's timeline-enabled space set.

- [ ] **Step 3: Include album options in smart-search repository types**

In `server/src/repositories/search.repository.ts`, include `SearchAlbumOptions` in smart search options because `SmartSearchDto` already carries `albumIds` through `BaseSearchWithResultsSchema`:

```ts
export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchAlbumOptions &
  SearchOcrOptions &
  SearchSpaceOptions &
  SearchOrderOptions;
```

No DTO schema change is needed for `searchSmart`; `albumIds` already exists on `BaseSearchWithResultsSchema`. Do not add `albumIds` to `SmartSearchFacetsDto` in this pass unless a product/API decision is made for album-scoped smart facets.

- [ ] **Step 4: Apply timeline scope when `albumId` is present in suggestions**

In `server/src/repositories/search.repository.ts`, replace `applySuggestionScope` with this implementation:

```ts
  private applySuggestionScope<T extends SelectQueryBuilder<DB, any, any>>(
    qb: T,
    userIds: string[],
    options?: SuggestionScopeOptions,
  ) {
    return qb
      .$if(!!options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('album_asset')
              .whereRef('album_asset.assetId', '=', 'asset.id')
              .where('album_asset.albumId', '=', asUuid(options!.albumId!)),
          ),
        ),
      )
      .$if(!!options?.albumId && !!options?.timelineSpaceIds?.length, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.albumId && !options?.timelineSpaceIds?.length, (qb) =>
        qb.where('asset.ownerId', '=', anyUuid(userIds)),
      )
      .$if(!options?.albumId && !options?.spaceId && !options?.timelineSpaceIds, (qb) =>
        qb.where('asset.ownerId', '=', anyUuid(userIds)),
      )
      .$if(!!options?.spaceId && !options?.timelineSpaceIds && !options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', asUuid(options!.spaceId!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.timelineSpaceIds?.length && !options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
          ]),
        ),
      );
  }
```

- [ ] **Step 5: Regenerate search SQL**

Run:

```bash
pnpm --dir server run sync:sql
```

Expected: exit code 0. The command can print known dummy-data warnings; the generated SQL files must include the new album-and-timeline scope for `search.repository`.

- [ ] **Step 6: Run the red tests again**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/services/people-identity-rbac.spec.ts --run -t "timeline opt-in"
pnpm --dir server test -- --run server/src/services/search.service.spec.ts
```

Expected: PASS for the tests added in Task 1.

- [ ] **Step 7: Commit search scope**

Run:

```bash
git add server/src/services/search.service.ts server/src/repositories/search.repository.ts server/src/queries/search.repository.sql server/src/services/search.service.spec.ts server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "fix: gate album people by timeline spaces"
```

---

## Task 3: Red Tests for Map and Album Map Scope

**Files:**

- Modify: `server/test/medium/specs/repositories/map.repository.spec.ts`
- Modify: `server/src/services/map.service.spec.ts`
- Modify: `server/src/services/album.service.spec.ts`

- [ ] **Step 1: Add map repository album tests**

Append these tests inside `describe('getMapMarkers', () => { ... })` in `server/test/medium/specs/repositories/map.repository.spec.ts`:

```ts
it('timeline opt-in: album-linked direct space asset requires a timeline-enabled containing space', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
  const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 7, longitude: 7 }).execute();
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
  const { album } = await ctx.newAlbum({ ownerId: member.id });
  await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

  const hidden = await sut.getMapMarkers([member.id], [album.id]);
  const visible = await sut.getMapMarkers([member.id], [album.id], { timelineSpaceIds: [space.id] });

  expect(hidden.find((marker) => marker.id === asset.id)).toBeUndefined();
  expect(visible.find((marker) => marker.id === asset.id)).toBeDefined();
});

it('timeline opt-in: album-linked library space asset requires a timeline-enabled containing space', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { library } = await ctx.newLibrary({ ownerId: owner.id });
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
  const { asset } = await ctx.newAsset({
    ownerId: owner.id,
    libraryId: library.id,
    visibility: AssetVisibility.Timeline,
  });
  await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 8, longitude: 8 }).execute();
  const { album } = await ctx.newAlbum({ ownerId: member.id });
  await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

  const hidden = await sut.getMapMarkers([member.id], [album.id]);
  const visible = await sut.getMapMarkers([member.id], [album.id], { timelineSpaceIds: [space.id] });

  expect(hidden.find((marker) => marker.id === asset.id)).toBeUndefined();
  expect(visible.find((marker) => marker.id === asset.id)).toBeDefined();
});
```

- [ ] **Step 2: Add map service test for shared albums**

Add this test to `server/src/services/map.service.spec.ts` inside `describe('getMapMarkers', () => { ... })`:

```ts
it('should pass timeline space IDs when shared albums are included', async () => {
  const auth = AuthFactory.create();
  const spaceId = '00000000-0000-4000-8000-000000000003';
  mocks.partner.getAll.mockResolvedValue([]);
  mocks.album.getOwned.mockResolvedValue([]);
  mocks.album.getShared.mockResolvedValue([]);
  mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
  mocks.map.getMapMarkers.mockResolvedValue([]);

  await sut.getMapMarkers(auth, { withSharedAlbums: true });

  expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
  expect(mocks.map.getMapMarkers).toHaveBeenCalledWith(
    [auth.user.id],
    [],
    expect.objectContaining({ timelineSpaceIds: [spaceId] }),
  );
});
```

- [ ] **Step 3: Add album service map test**

Add these imports to the top of `server/src/services/album.service.spec.ts`:

```ts
import { PartnerFactory } from 'test/factories/partner.factory';
```

Change the existing mapper import from:

```ts
import { getForAlbum } from 'test/mappers';
```

to:

```ts
import { getForAlbum, getForPartner } from 'test/mappers';
```

Add this test to `server/src/services/album.service.spec.ts`:

```ts
describe('getMapMarkers', () => {
  it('passes owner, partner, and timeline-enabled spaces to album map lookup', async () => {
    const auth = AuthFactory.create();
    const albumId = newUuid();
    const partnerId = newUuid();
    const spaceId = newUuid();
    const partner = PartnerFactory.create({ sharedById: partnerId, sharedWithId: auth.user.id, inTimeline: true });
    mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set([albumId]));
    mocks.partner.getAll.mockResolvedValue([getForPartner(partner)]);
    mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
    mocks.map.getAlbumMapMarkers.mockResolvedValue([]);

    await sut.getMapMarkers(auth, albumId);

    expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
    expect(mocks.map.getAlbumMapMarkers).toHaveBeenCalledWith(albumId, {
      ownerIds: [auth.user.id, partnerId],
      timelineSpaceIds: [spaceId],
    });
  });

  it('keeps shared-link album map lookup on the existing album-link path', async () => {
    const auth = AuthFactory.from().sharedLink({ showExif: true }).build();
    const albumId = newUuid();
    mocks.access.album.checkSharedLinkAccess.mockResolvedValue(new Set([albumId]));
    mocks.map.getAlbumMapMarkers.mockResolvedValue([]);

    await sut.getMapMarkers(auth, albumId);

    expect(mocks.partner.getAll).not.toHaveBeenCalled();
    expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
    expect(mocks.map.getAlbumMapMarkers).toHaveBeenCalledWith(albumId);
  });
});
```

Shared links do not have a viewer-specific `showInTimeline` preference. This test is a regression guard so the logged-in viewer scope does not accidentally change public/shared-link album maps in this pass. The product decision to block public re-sharing of shared-space assets belongs to the album-sharing follow-up, not this implementation.

- [ ] **Step 4: Run red map tests**

Run:

```bash
pnpm --dir server test -- --run server/src/services/map.service.spec.ts server/src/services/album.service.spec.ts
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/repositories/map.repository.spec.ts --run -t "timeline opt-in"
```

Expected: FAIL. The repository tests fail because album assets are not scoped by timeline spaces. The service tests fail until timeline spaces are resolved for shared albums and album map lookup.

---

## Task 4: Implement Map and Album Map Timeline Scope

**Files:**

- Modify: `server/src/repositories/map.repository.ts`
- Modify: `server/src/services/map.service.ts`
- Modify: `server/src/services/album.service.ts`
- Generated: `server/src/queries/map.repository.sql`

- [ ] **Step 1: Update `MapRepository` types**

In `server/src/repositories/map.repository.ts`, add this type near `MapMarkerSearchOptions`:

```ts
export interface AlbumMapMarkerSearchOptions {
  ownerIds: string[];
  timelineSpaceIds?: string[];
}
```

- [ ] **Step 2: Scope `getAlbumMapMarkers`**

Replace `getAlbumMapMarkers` with:

```ts
  @GenerateSql(
    { params: [DummyValue.UUID] },
    { name: 'scoped', params: [DummyValue.UUID, { ownerIds: [DummyValue.UUID], timelineSpaceIds: [DummyValue.UUID] }] },
  )
  getAlbumMapMarkers(albumId: string, options?: AlbumMapMarkerSearchOptions) {
    const query = this.mapMarkersQuery()
      .innerJoin('album_asset', 'asset.id', 'album_asset.assetId')
      .where('album_asset.albumId', '=', albumId);

    if (!options) {
      return query.execute();
    }

    return query
      .where((eb) => {
        const expression: Expression<SqlBool>[] = [eb('asset.ownerId', 'in', options.ownerIds)];

        if (options.timelineSpaceIds?.length) {
          expression.push(
            eb.exists((eb) =>
              eb
                .selectFrom('shared_space_asset')
                .whereRef('asset.id', '=', 'shared_space_asset.assetId')
                .where('shared_space_asset.spaceId', 'in', options.timelineSpaceIds!),
            ),
            eb.exists((eb) =>
              eb
                .selectFrom('shared_space_library')
                .whereRef('asset.libraryId', '=', 'shared_space_library.libraryId')
                .where('shared_space_library.spaceId', 'in', options.timelineSpaceIds!),
            ),
          );
        }

        return eb.or(expression);
      })
      .execute();
  }
```

- [ ] **Step 3: Scope album entries inside `getMapMarkers`**

In the `albumIds.length > 0` branch of `getMapMarkers`, replace the current album expression with:

```ts
const albumScope: Expression<SqlBool>[] = [eb('ownerId', 'in', ownerIds)];
if (timelineSpaceIds?.length) {
  albumScope.push(
    eb.exists((eb) =>
      eb
        .selectFrom('shared_space_asset')
        .whereRef('asset.id', '=', 'shared_space_asset.assetId')
        .where('shared_space_asset.spaceId', 'in', timelineSpaceIds),
    ),
    eb.exists((eb) =>
      eb
        .selectFrom('shared_space_library')
        .whereRef('asset.libraryId', '=', 'shared_space_library.libraryId')
        .where('shared_space_library.spaceId', 'in', timelineSpaceIds),
    ),
  );
}

expression.push(
  eb.and([
    eb.exists((eb) =>
      eb
        .selectFrom('album_asset')
        .whereRef('asset.id', '=', 'album_asset.assetId')
        .where('album_asset.albumId', 'in', albumIds),
    ),
    eb.or(albumScope),
  ]),
);
```

Keep the existing owner and timeline-space expressions. This change only prevents album rows from bypassing the same global scope.

- [ ] **Step 4: Resolve timeline spaces for shared albums in `MapService`**

In `server/src/services/map.service.ts`, change:

```ts
if (options.withSharedSpaces && options.isFavorite !== true) {
```

to:

```ts
if ((options.withSharedSpaces || options.withSharedAlbums) && options.isFavorite !== true) {
```

- [ ] **Step 5: Scope album map markers in `AlbumService`**

In `server/src/services/album.service.ts`, import `getMyPartnerIds`:

```ts
import { getMyPartnerIds } from 'src/utils/asset.util';
```

Then replace the final line of `getMapMarkers`:

```ts
return this.mapRepository.getAlbumMapMarkers(id);
```

with:

```ts
if (auth.sharedLink) {
  return this.mapRepository.getAlbumMapMarkers(id);
}

const partnerIds = await getMyPartnerIds({
  userId: auth.user.id,
  repository: this.partnerRepository,
  timelineEnabled: true,
});
const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);

return this.mapRepository.getAlbumMapMarkers(id, {
  ownerIds: [auth.user.id, ...partnerIds],
  timelineSpaceIds: spaceRows.length > 0 ? spaceRows.map((row) => row.spaceId) : undefined,
});
```

- [ ] **Step 6: Regenerate map SQL**

Run:

```bash
pnpm --dir server run sync:sql
```

Expected: exit code 0. `server/src/queries/map.repository.sql` changes to include album owner/timeline scope.

- [ ] **Step 7: Run map tests**

Run:

```bash
pnpm --dir server test -- --run server/src/services/map.service.spec.ts server/src/services/album.service.spec.ts
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/repositories/map.repository.spec.ts --run -t "timeline opt-in"
```

Expected: PASS.

- [ ] **Step 8: Commit map scope**

Run:

```bash
git add server/src/repositories/map.repository.ts server/src/services/map.service.ts server/src/services/album.service.ts server/src/services/map.service.spec.ts server/src/services/album.service.spec.ts server/test/medium/specs/repositories/map.repository.spec.ts server/src/queries/map.repository.sql
git commit -m "fix: gate album map assets by timeline spaces"
```

---

## Task 5: Red/Green Metadata Inheritance Reversibility

**Files:**

- Modify: `server/test/medium/specs/services/shared-space-person-metadata-rbac.spec.ts`

- [ ] **Step 1: Add direct-space reversibility test**

Add this test near the existing `clears a space-sourced inherited name when the source space is hidden from the asset adder timeline later` test:

```ts
it('restores a space-sourced inherited name when the source space is shown in the asset adder timeline again', async () => {
  const { ctx, sut, face, member, sourceSpace, sourceSpacePerson, targetSpacePerson } = await createSpaceNameBridge();

  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
  const hidden = await getSpacePersonById(ctx, targetSpacePerson.id);
  expect(hidden.name).toBe('');
  expect(hidden.nameSource).toBe('none');

  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
  const restored = await getSpacePersonById(ctx, targetSpacePerson.id);

  expect(restored.name).toBe('John');
  expect(restored.nameSource).toBe('inherited');
  expect(restored.nameSourceProfileType).toBe('space-person');
  expect(restored.nameSourceProfileId).toBe(sourceSpacePerson.id);
});
```

- [ ] **Step 2: Add linked-library reversibility test**

Add this test near the linked-library metadata tests:

```ts
it('restores linked-library inherited metadata when the source space is shown in the linker timeline again', async () => {
  const { ctx, sut, face, member, sourceSpace, sourceSpacePerson, library, targetSpace } =
    await createLinkedLibrarySpaceNameBridge();
  await sut.handleSharedSpaceLibraryFaceSync({ spaceId: targetSpace.id, libraryId: library.id });
  const targetSpacePerson = await getOnlySpacePerson(ctx, targetSpace.id);

  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
  const hidden = await getSpacePersonById(ctx, targetSpacePerson.id);
  expect(hidden.name).toBe('');
  expect(hidden.nameSource).toBe('none');
  expect(hidden.birthDate).toBeNull();

  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
  const restored = await getSpacePersonById(ctx, targetSpacePerson.id);

  expect(restored.name).toBe('John');
  expect(restored.nameSource).toBe('inherited');
  expect(restored.nameSourceProfileType).toBe('space-person');
  expect(restored.nameSourceProfileId).toBe(sourceSpacePerson.id);
  expect(asBirthDateString(restored.birthDate)).toBe('1980-01-02');
  expect(restored.birthDateSource).toBe('inherited');
});
```

- [ ] **Step 3: Add manual metadata lock test**

Add this test near the manual metadata tests:

```ts
it('keeps manual target metadata when source timeline visibility is toggled off and on', async () => {
  const { ctx, sut, face, member, sourceSpace, targetSpace, targetSpacePerson } = await createSpaceNameBridge();

  await sut.updateSpacePerson(authFor(member), targetSpace.id, targetSpacePerson.id, {
    name: 'Manual Target',
    birthDate: '2002-02-02',
  });
  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: false });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });
  await sut.updateMemberTimeline(authFor(member), sourceSpace.id, { showInTimeline: true });
  await sut.backfillSpacePersonMetadata({ identityId: face.identity.id, limit: 1000 });

  const updated = await getSpacePersonById(ctx, targetSpacePerson.id);
  expect(updated.name).toBe('Manual Target');
  expect(updated.nameSource).toBe('manual');
  expect(asBirthDateString(updated.birthDate)).toBe('2002-02-02');
  expect(updated.birthDateSource).toBe('manual');
});
```

- [ ] **Step 4: Run metadata tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/services/shared-space-person-metadata-rbac.spec.ts --run -t "restores|manual target metadata"
```

Expected: PASS. If a test fails, fix only the candidate selection or backfill logic in `server/src/repositories/shared-space.repository.ts` or `server/src/services/shared-space.service.ts`, then rerun this command.

- [ ] **Step 5: Commit metadata coverage**

Run:

```bash
git add server/test/medium/specs/services/shared-space-person-metadata-rbac.spec.ts server/src/repositories/shared-space.repository.ts server/src/services/shared-space.service.ts server/src/queries/shared.space.repository.sql
git commit -m "test: cover timeline opt-in metadata inheritance"
```

---

## Task 6: Full Verification and SQL Drift Check

**Files:**

- Read/verify: all files touched by Tasks 1-5

- [ ] **Step 1: Run focused medium tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs test/medium/specs/services/people-identity-rbac.spec.ts test/medium/specs/services/shared-space-person-metadata-rbac.spec.ts test/medium/specs/repositories/map.repository.spec.ts --run
```

Expected: PASS. This verifies people/search/filter/album/map and metadata inheritance together.

- [ ] **Step 2: Run focused small service tests**

Run:

```bash
pnpm --dir server test -- --run server/src/services/search.service.spec.ts server/src/services/map.service.spec.ts server/src/services/album.service.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
pnpm --dir server check
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Regenerate SQL and verify clean diff**

Run:

```bash
pnpm --dir server run sync:sql
git diff --check
git status --short
```

Expected: `sync:sql` exits 0. `git diff --check` prints no output. `git status --short` only lists intentional source, test, generated SQL, and plan files.

- [ ] **Step 5: Final commit**

If Task 6 produced additional generated SQL changes, commit them:

```bash
git add server/src/queries/search.repository.sql server/src/queries/map.repository.sql server/src/queries/shared.space.repository.sql
git commit -m "chore: sync timeline opt-in query sql"
```

If there are no additional generated SQL changes, do not create an empty commit.

---

## Coverage Matrix

- Global `/people`: existing tests plus Task 1 viewer-owned token regression.
- Global `searchPerson`: existing tests cover timeline-disabled direct and linked-library people.
- Global filter panel: existing tests plus Task 1 album-specific direct and linked-library cases.
- Global search suggestions: existing tests plus Task 1 album `CITY` suggestions.
- Global `searchMetadata`: Task 1 validates album assets, owner identity filters, stale scoped tokens, and non-member album-sharing boundaries.
- Global asset counters/random/large: Task 1 validates `searchStatistics`, `searchRandom`, and `searchLargeAssets` for album-scoped hidden and visible spaces.
- Smart search: Task 1 small service coverage verifies album-scoped smart search resolves timeline-enabled spaces, and Task 2 adds the missing repository option type.
- Explicit `spaceId`: Task 1 verifies disabled spaces still work when explicitly scoped.
- Album filter/search scope: Task 1 covers direct and linked-library `album_asset` rows, stale `space-person:` tokens, and album viewers who are not source-space members.
- Global map with shared albums: Task 3 and Task 4 cover service and repository scope for direct and linked-library space assets.
- Album map endpoint: Task 3 and Task 4 cover logged-in viewer scope; shared-link album map behavior is regression-tested as unchanged because public link re-share policy is a separate product decision.
- Metadata inheritance: Task 5 covers direct source, linked-library source, re-enable restore, and manual lock. Existing tests already cover removed memberships, deleted spaces, hidden source people, and leave/rejoin cycles.
- Linked libraries: Task 1 and Task 3 cover album/filter/search/map; Task 5 covers metadata.
- Per-viewer opt-in: Task 1 verifies one member can hide a space without hiding it for another member.
- RBAC leakage: assertions check serialized payloads do not contain disabled-space names when hidden, non-members and admins do not bypass source-space membership, and `AlbumRead` does not re-share a source-space-only person to another logged-in album viewer.

## Notes

- Do not run lint during implementation unless the user asks; focused tests and `server check` are sufficient for this pass.
- Do not skip hooks when committing.
- Do not force-push.
- Keep the shared-space asset album-sharing product change out of this implementation.
