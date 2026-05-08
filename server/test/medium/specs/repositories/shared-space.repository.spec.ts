import { Kysely } from 'kysely';
import { AssetVisibility } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(SharedSpaceRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const expectStats = (
  result: {
    detectedFaceCount: number;
    assignedVisibleFaceCount: number;
    namedVisiblePersonCount?: number;
    assignedHiddenFaceCount: number;
    unassignedFaceCount: number;
  },
  expected: {
    detectedFaceCount: number;
    assignedVisibleFaceCount: number;
    namedVisiblePersonCount?: number;
    assignedHiddenFaceCount: number;
    unassignedFaceCount: number;
  },
) => {
  expect(Number(result.detectedFaceCount)).toBe(expected.detectedFaceCount);
  expect(Number(result.assignedVisibleFaceCount)).toBe(expected.assignedVisibleFaceCount);
  if (expected.namedVisiblePersonCount !== undefined) {
    expect(Number(result.namedVisiblePersonCount)).toBe(expected.namedVisiblePersonCount);
  }
  expect(Number(result.assignedHiddenFaceCount)).toBe(expected.assignedHiddenFaceCount);
  expect(Number(result.unassignedFaceCount)).toBe(expected.unassignedFaceCount);
};

describe(SharedSpaceRepository.name, () => {
  // ==========================================
  // Space CRUD
  // ==========================================

  describe('create', () => {
    it('should create a space and return it', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const result = await sut.create({ name: 'My Space', createdById: user.id });

      expect(result).toMatchObject({
        name: 'My Space',
        createdById: user.id,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return a space by id', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id, name: 'Find Me' });

      const result = await sut.getById(space.id);

      expect(result).toMatchObject({
        id: space.id,
        name: 'Find Me',
        createdById: user.id,
      });
    });

    it('should return undefined for non-existent id', async () => {
      const { sut } = setup();

      const result = await sut.getById('00000000-0000-4000-8000-000000000000');

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update space name', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id, name: 'Original' });

      const result = await sut.update(space.id, { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(result.id).toBe(space.id);
    });
  });

  describe('remove', () => {
    it('should delete a space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      await sut.remove(space.id);

      const result = await sut.getById(space.id);
      expect(result).toBeUndefined();
    });
  });

  // ==========================================
  // Member Management
  // ==========================================

  describe('addMember', () => {
    it('should add a member to a space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const result = await sut.addMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      expect(result).toMatchObject({
        spaceId: space.id,
        userId: user.id,
        role: 'editor',
      });
    });
  });

  describe('getMembers', () => {
    it('should return members with user data', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser({ name: 'Owner', email: 'owner@test.com' });
      const { user: member } = await ctx.newUser({ name: 'Member', email: 'member@test.com' });
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });

      const members = await sut.getMembers(space.id);

      expect(members).toHaveLength(2);
      const emails = members.map((m) => m.email);
      expect(emails).toContain('owner@test.com');
      expect(emails).toContain('member@test.com');
      expect(members[0]).toHaveProperty('name');
      expect(members[0]).toHaveProperty('profileImagePath');
    });

    it('should exclude soft-deleted users', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: deleted } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: deleted.id, role: 'viewer' });

      await ctx.database.updateTable('user').set({ deletedAt: new Date() }).where('id', '=', deleted.id).execute();

      const members = await sut.getMembers(space.id);

      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(owner.id);
    });
  });

  describe('getMember', () => {
    it('should return a specific member', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser({ name: 'Alice' });
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      const result = await sut.getMember(space.id, user.id);

      expect(result).toMatchObject({
        spaceId: space.id,
        userId: user.id,
        role: 'editor',
        name: 'Alice',
      });
    });

    it('should return undefined for non-member', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });

      const result = await sut.getMember(space.id, stranger.id);

      expect(result).toBeUndefined();
    });
  });

  describe('updateMember', () => {
    it('should update member role', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'viewer' });

      const result = await sut.updateMember(space.id, user.id, { role: 'editor' });

      expect(result.role).toBe('editor');
    });

    it('should update showInTimeline', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      const result = await sut.updateMember(space.id, user.id, { showInTimeline: false });

      expect(result.showInTimeline).toBe(false);
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });

      await sut.removeMember(space.id, member.id);

      const result = await sut.getMember(space.id, member.id);
      expect(result).toBeUndefined();

      // Owner should still be there
      const ownerMember = await sut.getMember(space.id, owner.id);
      expect(ownerMember).toBeDefined();
    });
  });

  // ==========================================
  // Asset Management
  // ==========================================

  describe('addAssets', () => {
    it('should add assets to a space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });

      const result = await sut.addAssets([
        { spaceId: space.id, assetId: asset1.id, addedById: user.id },
        { spaceId: space.id, assetId: asset2.id, addedById: user.id },
      ]);

      expect(result).toHaveLength(2);
      const assetIds = result.map((r) => r.assetId);
      expect(assetIds).toContain(asset1.id);
      expect(assetIds).toContain(asset2.id);
    });

    it('should handle empty array', async () => {
      const { sut } = setup();

      const result = await sut.addAssets([]);

      expect(result).toEqual([]);
    });

    it('should handle duplicate assets (onConflict doNothing)', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: user.id }]);

      // Adding the same asset again should not throw
      const result = await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: user.id }]);

      // onConflict doNothing returns empty for duplicates
      expect(result).toHaveLength(0);

      // Still only one record in the table
      const count = await sut.getAssetCount(space.id);
      expect(count).toBe(1);
    });
  });

  describe('bulkAddUserAssets', () => {
    it('should insert all non-deleted, non-offline assets owned by the user', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(2);
    });

    it('should return correct inserted row count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(3);
    });

    it('should skip soft-deleted assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id, deletedAt: new Date() });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(1);
    });

    it('should skip offline assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id, isOffline: true });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(1);
    });

    it('should skip hidden and locked assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
      await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Hidden });
      await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(2);
      const assets = await ctx.database
        .selectFrom('shared_space_asset')
        .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
        .select('asset.visibility')
        .where('shared_space_asset.spaceId', '=', space.id)
        .execute();
      expect(assets.map(({ visibility }) => visibility).toSorted()).toEqual([
        AssetVisibility.Archive,
        AssetVisibility.Timeline,
      ]);
    });

    it('should not insert assets owned by other users', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAsset({ ownerId: other.id });

      const count = await sut.bulkAddUserAssets(space.id, owner.id);

      expect(count).toBe(1);
    });

    it('should handle ON CONFLICT when some assets already exist', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: existing } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: existing.id, addedById: user.id });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(1);
    });

    it('should return 0 when all assets already in space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(0);
    });

    it('should return 0 when user has no assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const count = await sut.bulkAddUserAssets(space.id, user.id);

      expect(count).toBe(0);
    });

    it('should set addedById to the userId', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });

      await sut.bulkAddUserAssets(space.id, user.id);

      const rows = await ctx.database
        .selectFrom('shared_space_asset')
        .selectAll()
        .where('spaceId', '=', space.id)
        .execute();
      expect(rows).toHaveLength(1);
      expect(rows[0].addedById).toBe(user.id);
    });

    it('should set spaceId correctly on all inserted rows', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newAsset({ ownerId: user.id });

      await sut.bulkAddUserAssets(space1.id, user.id);

      const space1Assets = await sut.getAssetIdsInSpace(space1.id);
      const space2Assets = await sut.getAssetIdsInSpace(space2.id);
      expect(space1Assets).toHaveLength(1);
      expect(space2Assets).toHaveLength(0);
    });

    it('should not affect other spaces assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: existingAsset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space2.id, assetId: existingAsset.id, addedById: user.id });

      await ctx.newAsset({ ownerId: user.id });
      await sut.bulkAddUserAssets(space1.id, user.id);

      const space2Assets = await sut.getAssetIdsInSpace(space2.id);
      expect(space2Assets).toHaveLength(1);
    });
  });

  describe('getAssetIdsInSpacePage', () => {
    it('returns direct and linked-library assets in stable id order with keyset pagination', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

      const { asset: directB } = await ctx.newAsset({
        ownerId: user.id,
        id: '00000000-0000-4000-a000-000000000020',
      });
      const { asset: directA } = await ctx.newAsset({
        ownerId: user.id,
        id: '00000000-0000-4000-a000-000000000010',
      });
      const { asset: libraryAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        id: '00000000-0000-4000-a000-000000000030',
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directB.id, addedById: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directA.id, addedById: user.id });

      const firstPage = await sut.getAssetIdsInSpacePage(space.id, { limit: 2 });
      const secondPage = await sut.getAssetIdsInSpacePage(space.id, {
        limit: 2,
        afterAssetId: firstPage.at(-1)?.assetId,
      });

      expect(firstPage.map(({ assetId }) => assetId)).toEqual([directA.id, directB.id]);
      expect(secondPage.map(({ assetId }) => assetId)).toEqual([libraryAsset.id]);
    });

    it('deduplicates assets reachable directly and through a linked library', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

      const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10 });

      expect(page).toEqual([{ assetId: asset.id }]);
    });

    it('filters deleted and offline linked-library assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { asset: visible } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      await ctx.newAsset({ ownerId: user.id, libraryId: library.id, deletedAt: new Date() });
      await ctx.newAsset({ ownerId: user.id, libraryId: library.id, isOffline: true });

      const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10 });

      expect(page).toEqual([{ assetId: visible.id }]);
    });

    it('filters hidden and locked assets from face-match pagination', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

      const { asset: directVisible } = await ctx.newAsset({
        ownerId: user.id,
        id: '00000000-0000-4000-a000-000000000011',
        visibility: AssetVisibility.Timeline,
      });
      const { asset: directHidden } = await ctx.newAsset({
        ownerId: user.id,
        id: '00000000-0000-4000-a000-000000000012',
        visibility: AssetVisibility.Hidden,
      });
      const { asset: directLocked } = await ctx.newAsset({
        ownerId: user.id,
        id: '00000000-0000-4000-a000-000000000013',
        visibility: AssetVisibility.Locked,
      });
      const { asset: linkedVisible } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        id: '00000000-0000-4000-a000-000000000014',
        visibility: AssetVisibility.Archive,
      });
      await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        id: '00000000-0000-4000-a000-000000000015',
        visibility: AssetVisibility.Hidden,
      });

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directVisible.id, addedById: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directHidden.id, addedById: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directLocked.id, addedById: user.id });

      const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10 });

      expect(page.map(({ assetId }) => assetId)).toEqual([directVisible.id, linkedVisible.id]);
    });

    it('returns an empty page after the last asset id', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

      const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10, afterAssetId: asset.id });

      expect(page).toEqual([]);
    });
  });

  describe('space activity from direct asset links', () => {
    it('should exclude hidden assets from member contribution and recent activity', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: visibleAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: hiddenAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Hidden,
      });

      const visibleAddedAt = new Date('2026-01-01T00:00:00.000Z');
      const hiddenAddedAt = new Date('2026-01-02T00:00:00.000Z');
      await ctx.database
        .insertInto('shared_space_asset')
        .values([
          { spaceId: space.id, assetId: visibleAsset.id, addedById: user.id, addedAt: visibleAddedAt },
          { spaceId: space.id, assetId: hiddenAsset.id, addedById: user.id, addedAt: hiddenAddedAt },
        ])
        .execute();

      const [contribution] = await sut.getContributionCounts(space.id);
      const [activity] = await sut.getMemberActivity(space.id);
      const lastAddedAt = await sut.getLastAssetAddedAt(space.id);

      expect(Number(contribution.count)).toBe(1);
      expect(activity.recentAssetId).toBe(visibleAsset.id);
      expect(activity.lastAddedAt).toEqual(visibleAddedAt);
      expect(lastAddedAt).toEqual(visibleAddedAt);
    });

    it('should exclude hidden assets from last contributor', async () => {
      const { ctx, sut } = setup();
      const { user: visibleContributor } = await ctx.newUser({ name: 'Visible Contributor' });
      const { user: hiddenContributor } = await ctx.newUser({ name: 'Hidden Contributor' });
      const { space } = await ctx.newSharedSpace({ createdById: visibleContributor.id });
      const { asset: visibleAsset } = await ctx.newAsset({
        ownerId: visibleContributor.id,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: hiddenAsset } = await ctx.newAsset({
        ownerId: hiddenContributor.id,
        visibility: AssetVisibility.Hidden,
      });

      await ctx.database
        .insertInto('shared_space_asset')
        .values([
          {
            spaceId: space.id,
            assetId: visibleAsset.id,
            addedById: visibleContributor.id,
            addedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            spaceId: space.id,
            assetId: hiddenAsset.id,
            addedById: hiddenContributor.id,
            addedAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ])
        .execute();

      const contributor = await sut.getLastContributor(space.id, new Date('2025-01-01T00:00:00.000Z'));

      expect(contributor).toEqual({ id: visibleContributor.id, name: 'Visible Contributor' });
    });
  });

  describe('getAssetCount', () => {
    it('should count non-deleted assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });

      const count = await sut.getAssetCount(space.id);

      expect(count).toBe(2);
    });

    it('should exclude soft-deleted assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: alive } = await ctx.newAsset({ ownerId: user.id });
      const { asset: deleted } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: alive.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: deleted.id });

      await ctx.softDeleteAsset(deleted.id);

      const count = await sut.getAssetCount(space.id);

      expect(count).toBe(1);
    });

    it('should exclude hidden and locked assets from the visible asset count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });

      const { asset: timelineAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: archivedAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Archive,
      });
      const { asset: hiddenAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Hidden,
      });
      const { asset: lockedAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Locked,
      });
      const { asset: linkedTimelineAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Hidden,
      });

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: timelineAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: archivedAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: hiddenAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: lockedAsset.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

      const count = await sut.getAssetCount(space.id);

      expect(count).toBe(3);
      expect(linkedTimelineAsset.id).toBeDefined();
    });
  });

  describe('removeAssets', () => {
    it('should remove assets from a space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });

      await sut.removeAssets(space.id, [asset1.id]);

      const count = await sut.getAssetCount(space.id);
      expect(count).toBe(1);
    });
  });

  // ==========================================
  // Timeline & Queries
  // ==========================================

  describe('getAllByUserId', () => {
    it('should return spaces where user is a member', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id, name: 'Space 1' });
      const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id, name: 'Space 2' });
      await ctx.newSharedSpaceMember({ spaceId: space1.id, userId: user.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: space2.id, userId: user.id, role: 'viewer' });

      const spaces = await sut.getAllByUserId(user.id);

      expect(spaces).toHaveLength(2);
      const names = spaces.map((s) => s.name);
      expect(names).toContain('Space 1');
      expect(names).toContain('Space 2');
    });

    it('should not return spaces where user is not a member', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      await ctx.newSharedSpace({ createdById: owner.id, name: 'Private Space' });

      const spaces = await sut.getAllByUserId(stranger.id);

      expect(spaces).toHaveLength(0);
    });
  });

  describe('getSpaceIdsForTimeline', () => {
    it('should return space ids where showInTimeline is true', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      const result = await sut.getSpaceIdsForTimeline(user.id);

      expect(result).toHaveLength(1);
      expect(result[0].spaceId).toBe(space.id);
    });

    it('should exclude spaces where showInTimeline is false', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: visible } = await ctx.newSharedSpace({ createdById: user.id, name: 'Visible' });
      const { space: hidden } = await ctx.newSharedSpace({ createdById: user.id, name: 'Hidden' });
      await ctx.newSharedSpaceMember({ spaceId: visible.id, userId: user.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: hidden.id, userId: user.id, role: 'editor' });

      // Set showInTimeline to false for the hidden space
      await sut.updateMember(hidden.id, user.id, { showInTimeline: false });

      const result = await sut.getSpaceIdsForTimeline(user.id);

      expect(result).toHaveLength(1);
      expect(result[0].spaceId).toBe(visible.id);
    });
  });

  describe('getRecentAssets', () => {
    it('should return recent assets ordered by addedAt desc', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: asset1 } = await ctx.newAsset({
        ownerId: user.id,
        thumbhash: Buffer.from('thumb1'),
        fileCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const { asset: asset2 } = await ctx.newAsset({
        ownerId: user.id,
        thumbhash: Buffer.from('thumb2'),
        fileCreatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      const { asset: asset3 } = await ctx.newAsset({
        ownerId: user.id,
        thumbhash: Buffer.from('thumb3'),
        fileCreatedAt: new Date('2026-01-03T00:00:00.000Z'),
      });

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset1.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset2.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset3.id });

      const result = await sut.getRecentAssets(space.id, 2);

      expect(result).toHaveLength(2);
      // Most recent first (asset3 added last)
      expect(result[0].id).toBe(asset3.id);
      expect(result[1].id).toBe(asset2.id);
      expect(result[0]).toHaveProperty('thumbhash');
    });

    it('should exclude assets without a thumbhash', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: withThumb } = await ctx.newAsset({ ownerId: user.id, thumbhash: Buffer.from('thumb1') });
      const { asset: withoutThumb } = await ctx.newAsset({ ownerId: user.id, thumbhash: null });

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: withoutThumb.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: withThumb.id });

      const result = await sut.getRecentAssets(space.id, 4);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(withThumb.id);
    });
  });

  describe('getNewAssetCount', () => {
    it('should count assets added after given date', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: oldAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: newAsset } = await ctx.newAsset({ ownerId: user.id });

      // Insert old asset with a past addedAt
      const pastDate = new Date('2020-01-01T00:00:00.000Z');
      await ctx.database
        .insertInto('shared_space_asset')
        .values({ spaceId: space.id, assetId: oldAsset.id, addedById: null, addedAt: pastDate })
        .execute();

      // Insert new asset (default addedAt is now)
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: newAsset.id });

      const since = new Date('2023-01-01T00:00:00.000Z');
      const count = await sut.getNewAssetCount(space.id, since);

      expect(count).toBe(1);
    });

    it('should exclude hidden assets from new asset count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      const { asset: timelineAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: hiddenAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Hidden,
      });
      await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Hidden,
      });

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: timelineAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: hiddenAsset.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

      const count = await sut.getNewAssetCount(space.id, new Date('2023-01-01T00:00:00.000Z'));

      expect(count).toBe(1);
    });
  });

  // ==========================================
  // Activity (existing tests)
  // ==========================================

  describe('logActivity', () => {
    it('should log an activity record', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'asset_add' });

      const rows = await ctx.database
        .selectFrom('shared_space_activity')
        .selectAll()
        .where('spaceId', '=', space.id)
        .execute();

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        spaceId: space.id,
        userId: user.id,
        type: 'asset_add',
      });
    });

    it('should default data to empty object when not provided', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'member_join' });

      const rows = await ctx.database
        .selectFrom('shared_space_activity')
        .selectAll()
        .where('spaceId', '=', space.id)
        .execute();

      expect(rows).toHaveLength(1);
      expect(rows[0].data).toEqual({});
    });

    it('should store activity metadata', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({
        spaceId: space.id,
        userId: user.id,
        type: 'asset_add',
        data: { assetCount: 5 },
      });

      const rows = await ctx.database
        .selectFrom('shared_space_activity')
        .selectAll()
        .where('spaceId', '=', space.id)
        .execute();

      expect(rows).toHaveLength(1);
      expect(rows[0].data).toEqual({ assetCount: 5 });
    });
  });

  describe('getActivities', () => {
    it('should return activities ordered by createdAt desc', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'first' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'second' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'third' });

      const activities = await sut.getActivities(space.id);

      expect(activities).toHaveLength(3);
      expect(activities[0].type).toBe('third');
      expect(activities[1].type).toBe('second');
      expect(activities[2].type).toBe('first');
    });

    it('should return user data with activities', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser({ name: 'Test User', email: 'testuser@example.com' });
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'asset_add' });

      const activities = await sut.getActivities(space.id);

      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        userId: user.id,
        name: 'Test User',
        email: 'testuser@example.com',
      });
    });

    it('should paginate with limit and offset', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'type_1' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'type_2' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'type_3' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'type_4' });
      await sut.logActivity({ spaceId: space.id, userId: user.id, type: 'type_5' });

      // Order is desc by createdAt: type_5, type_4, type_3, type_2, type_1
      const activities = await sut.getActivities(space.id, 2, 1);

      expect(activities).toHaveLength(2);
      expect(activities[0].type).toBe('type_4');
      expect(activities[1].type).toBe('type_3');
    });

    it('should handle activities from deleted users', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: deletedUser } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: deletedUser.id, role: 'editor' });

      await sut.logActivity({ spaceId: space.id, userId: deletedUser.id, type: 'asset_add' });

      // Hard-delete the user (FK ON DELETE SET NULL sets userId to null)
      await ctx.database.deleteFrom('shared_space_member').where('userId', '=', deletedUser.id).execute();
      await ctx.database.deleteFrom('user').where('id', '=', deletedUser.id).execute();

      const activities = await sut.getActivities(space.id);

      expect(activities).toHaveLength(1);
      expect(activities[0].userId).toBeNull();
      expect(activities[0].name).toBeNull();
      expect(activities[0].email).toBeNull();
    });
  });

  describe('getAssetFacesForMatching', () => {
    it('should exclude faces with isVisible = false', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: asset.id, isVisible: true });
      const { assetFace: invisibleFace } = await ctx.newAssetFace({ assetId: asset.id, isVisible: false });

      // getAssetFacesForMatching inner-joins face_search, so both faces need
      // face_search rows or they will be excluded independently of the isVisible
      // filter. Seed them directly.
      await ctx.database
        .insertInto('face_search')
        .values([
          { faceId: visibleFace.id, embedding: newEmbedding() },
          { faceId: invisibleFace.id, embedding: newEmbedding() },
        ])
        .execute();

      const result = await sut.getAssetFacesForMatching(asset.id);

      expect(result.map((f) => f.id)).toEqual([visibleFace.id]);
    });
  });

  describe('recountPersons with filters', () => {
    it('should exclude trashed, archived, invisible, and deleted-face rows from counts', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Test',
        representativeFaceId: null,
        type: 'person',
      });

      // Visible, timeline, not trashed — should count
      const { asset: assetA } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: faceA } = await ctx.newAssetFace({ assetId: assetA.id, isVisible: true });
      // Trashed asset — should NOT count
      const { asset: assetB } = await ctx.newAsset({ ownerId: user.id, deletedAt: new Date() });
      const { assetFace: faceB } = await ctx.newAssetFace({ assetId: assetB.id, isVisible: true });
      // Archived asset — should NOT count
      const { asset: assetC } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
      const { assetFace: faceC } = await ctx.newAssetFace({ assetId: assetC.id, isVisible: true });
      // Invisible face — should NOT count
      const { asset: assetD } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: faceD } = await ctx.newAssetFace({ assetId: assetD.id, isVisible: false });

      await sut.addPersonFaces(
        [faceA, faceB, faceC, faceD].map((f) => ({ personId: spacePerson.id, assetFaceId: f.id })),
        { skipRecount: true },
      );

      await sut.recountPersons([spacePerson.id]);

      const after = await sut.getPersonById(spacePerson.id);
      expect(after?.assetCount).toBe(1);
      expect(after?.faceCount).toBe(1);
    });
  });

  describe('removePersonFacesByLibrary', () => {
    it('should delete space-person mappings for all assets in the given library and recount', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      // 2 assets in the target library and 1 in a different library (no libraryId)
      const { asset: libAsset1 } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      const { asset: libAsset2 } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace: f1 } = await ctx.newAssetFace({ assetId: libAsset1.id });
      const { assetFace: f2 } = await ctx.newAssetFace({ assetId: libAsset2.id });
      const { assetFace: f3 } = await ctx.newAssetFace({ assetId: otherAsset.id });

      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: null,
        type: 'person',
      });
      await sut.addPersonFaces(
        [f1, f2, f3].map((f) => ({ personId: spacePerson.id, assetFaceId: f.id })),
        { skipRecount: false },
      );

      await sut.removePersonFacesByLibrary(space.id, library.id);

      const remaining = await sut.getPersonAssetIds(spacePerson.id);
      expect(remaining.map((r) => r.assetId).toSorted()).toEqual([otherAsset.id]);
      const after = await sut.getPersonById(spacePerson.id);
      expect(after?.assetCount).toBe(1);
    });
  });

  describe('getEditableByAssetIds', () => {
    it('returns spaces containing the asset where the user is Editor', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: user.id }]);

      const result = await sut.getEditableByAssetIds(user.id, new Set([asset.id]));

      expect(result).toEqual(new Set([space.id]));
    });

    it('returns spaces containing the asset where the user is Owner', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'owner' });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: user.id }]);

      const result = await sut.getEditableByAssetIds(user.id, new Set([asset.id]));

      expect(result).toEqual(new Set([space.id]));
    });

    it('excludes spaces where the user is only a Viewer', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: viewer } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id, role: 'viewer' });

      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: owner.id }]);

      const result = await sut.getEditableByAssetIds(viewer.id, new Set([asset.id]));

      expect(result).toEqual(new Set());
    });

    it('excludes spaces where the user is not a member', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });

      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await sut.addAssets([{ spaceId: space.id, assetId: asset.id, addedById: owner.id }]);

      const result = await sut.getEditableByAssetIds(stranger.id, new Set([asset.id]));

      expect(result).toEqual(new Set());
    });

    it('returns multiple spaces when the asset is in several editable ones', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: spaceA } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: spaceB } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: spaceA.id, userId: user.id, role: 'editor' });
      await ctx.newSharedSpaceMember({ spaceId: spaceB.id, userId: user.id, role: 'owner' });

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await sut.addAssets([
        { spaceId: spaceA.id, assetId: asset.id, addedById: user.id },
        { spaceId: spaceB.id, assetId: asset.id, addedById: user.id },
      ]);

      const result = await sut.getEditableByAssetIds(user.id, new Set([asset.id]));

      expect(result).toEqual(new Set([spaceA.id, spaceB.id]));
    });

    it('returns spaces containing ANY of the given asset ids', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: 'editor' });

      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      // Only asset1 is in the space; asset2 is loose.
      await sut.addAssets([{ spaceId: space.id, assetId: asset1.id, addedById: user.id }]);

      const result = await sut.getEditableByAssetIds(user.id, new Set([asset1.id, asset2.id]));

      expect(result).toEqual(new Set([space.id]));
    });

    it('returns empty set when input is empty', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const result = await sut.getEditableByAssetIds(user.id, new Set());

      expect(result).toEqual(new Set());
    });
  });

  // ==========================================
  // getPersonsBySpaceId
  // ==========================================

  describe('getPersonsBySpaceId', () => {
    describe('getPersonalThumbnailForSpacePerson', () => {
      it('returns a linked personal thumbnail when its feature face asset is in the space', async () => {
        const { ctx, sut } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: viewer } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
        const identity = await ctx.database
          .insertInto('face_identity')
          .values({ type: 'person' })
          .returningAll()
          .executeTakeFirstOrThrow();
        const { result: person } = await ctx.newPerson({ ownerId: owner.id, thumbnailPath: '/owner-thumb.jpg' });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        await ctx.database
          .updateTable('person')
          .set({ identityId: identity.id, faceAssetId: assetFace.id })
          .where('id', '=', person.id)
          .execute();

        const result = await sut.getPersonalThumbnailForSpacePerson({
          userId: viewer.id,
          spaceId: space.id,
          identityId: identity.id,
        });

        expect(result).toEqual({ personId: person.id, thumbnailPath: '/owner-thumb.jpg' });
      });

      it('does not return another user thumbnail when its feature face asset is outside the space', async () => {
        const { ctx, sut } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: viewer } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
        const identity = await ctx.database
          .insertInto('face_identity')
          .values({ type: 'person' })
          .returningAll()
          .executeTakeFirstOrThrow();
        const { result: person } = await ctx.newPerson({ ownerId: owner.id, thumbnailPath: '/private-thumb.jpg' });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        await ctx.database
          .updateTable('person')
          .set({ identityId: identity.id, faceAssetId: assetFace.id })
          .where('id', '=', person.id)
          .execute();

        const result = await sut.getPersonalThumbnailForSpacePerson({
          userId: viewer.id,
          spaceId: space.id,
          identityId: identity.id,
        });

        expect(result).toBeUndefined();
      });

      it('prefers the viewer-owned personal thumbnail', async () => {
        const { ctx, sut } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: viewer } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id });
        const identity = await ctx.database
          .insertInto('face_identity')
          .values({ type: 'person' })
          .returningAll()
          .executeTakeFirstOrThrow();

        const { asset: ownerAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: ownerAsset.id, addedById: owner.id });
        const { result: ownerPerson } = await ctx.newPerson({
          ownerId: owner.id,
          thumbnailPath: '/owner-thumb.jpg',
        });
        const { assetFace: ownerFace } = await ctx.newAssetFace({ assetId: ownerAsset.id, personId: ownerPerson.id });
        await ctx.database
          .updateTable('person')
          .set({ identityId: identity.id, faceAssetId: ownerFace.id })
          .where('id', '=', ownerPerson.id)
          .execute();

        const { asset: viewerAsset } = await ctx.newAsset({
          ownerId: viewer.id,
          visibility: AssetVisibility.Timeline,
        });
        const { result: viewerPerson } = await ctx.newPerson({
          ownerId: viewer.id,
          thumbnailPath: '/viewer-thumb.jpg',
        });
        const { assetFace: viewerFace } = await ctx.newAssetFace({
          assetId: viewerAsset.id,
          personId: viewerPerson.id,
        });
        await ctx.database
          .updateTable('person')
          .set({ identityId: identity.id, faceAssetId: viewerFace.id })
          .where('id', '=', viewerPerson.id)
          .execute();

        const result = await sut.getPersonalThumbnailForSpacePerson({
          userId: viewer.id,
          spaceId: space.id,
          identityId: identity.id,
        });

        expect(result).toEqual({ personId: viewerPerson.id, thumbnailPath: '/viewer-thumb.jpg' });
      });
    });

    it('should return space persons whose global person has no thumbnail', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create a global person with empty thumbnailPath
      const { result: person } = await ctx.newPerson({ ownerId: user.id, thumbnailPath: '' });
      const { assetFace: face } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: 'No Thumbnail Person',
        representativeFaceId: face.id,
        type: 'person',
      });

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(spacePerson.id);
      expect(result[0].name).toBe('No Thumbnail Person');
    });

    it('should exclude unnamed space persons below the minimum face count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const assets = await Promise.all(
        Array.from({ length: 6 }).map(() => ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline })),
      );
      for (const { asset } of assets) {
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      }
      const faces = [];
      for (const { asset } of assets) {
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
        faces.push(assetFace);
      }

      const namedSingleFace = await sut.createPerson({
        spaceId: space.id,
        name: 'Named',
        representativeFaceId: faces[0].id,
      });
      const unnamedLowEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[1].id,
      });
      const unnamedEnoughEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[3].id,
      });
      await sut.addPersonFaces([
        { personId: namedSingleFace.id, assetFaceId: faces[0].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[1].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[2].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[3].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[4].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[5].id },
      ]);

      const result = await sut.getPersonsBySpaceId(space.id, { minimumFaceCount: 3 });

      expect(result.map((person) => person.id)).toEqual([namedSingleFace.id, unnamedEnoughEvidence.id]);
    });

    it('should return space persons whose representativeFace has no global personId', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      // Create a face with no personId (default is null)
      const { assetFace: face } = await ctx.newAssetFace({ assetId: asset.id });

      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Orphan Face Person',
        representativeFaceId: face.id,
        type: 'person',
      });

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(spacePerson.id);
    });

    it('should return space persons whose representative face was deleted', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const { result: person } = await ctx.newPerson({ ownerId: user.id, thumbnailPath: '/thumb.jpg' });
      const { assetFace: face } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      const spacePerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Deleted Face Person',
        representativeFaceId: face.id,
        type: 'person',
      });

      // Soft-delete the representative face
      await ctx.database.updateTable('asset_face').set({ deletedAt: new Date() }).where('id', '=', face.id).execute();

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(spacePerson.id);
    });

    it('should not fall back to private global person metadata when space person has no name', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const { result: person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Global Name',
        thumbnailPath: '/path/to/thumbnail.jpg',
      });
      const { assetFace: face } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: face.id,
        type: 'person',
      });

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('');
    });

    it('should sort space persons alphabetically by name', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const charlie = await sut.createPerson({
        spaceId: space.id,
        name: 'Charlie',
        representativeFaceId: null,
        type: 'person',
        assetCount: 10,
      });
      const alice = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: null,
        type: 'person',
        assetCount: 1,
      });
      const bob = await sut.createPerson({
        spaceId: space.id,
        name: 'Bob',
        representativeFaceId: null,
        type: 'person',
        assetCount: 5,
      });

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result.map((p) => p.id)).toEqual([alice.id, bob.id, charlie.id]);
    });

    it('should sort unnamed space persons after named rows by asset count without private global fallback', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const { result: globalBob } = await ctx.newPerson({ ownerId: user.id, name: 'Bob' });
      const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id, personId: globalBob.id });

      const charlie = await sut.createPerson({
        spaceId: space.id,
        name: 'Charlie',
        representativeFaceId: null,
        type: 'person',
        assetCount: 5,
      });
      const bob = await sut.createPerson({
        id: '00000000-0000-4000-8000-000000000001',
        spaceId: space.id,
        name: '',
        representativeFaceId: bobFace.id,
        type: 'person',
        assetCount: 1,
      });
      const unnamedMany = await sut.createPerson({
        id: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
        spaceId: space.id,
        name: '',
        representativeFaceId: null,
        type: 'person',
        assetCount: 10,
      });
      const alice = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: null,
        type: 'person',
        assetCount: 5,
      });

      const result = await sut.getPersonsBySpaceId(space.id, {});

      expect(result.map((p) => p.id)).toEqual([alice.id, charlie.id, unnamedMany.id, bob.id]);
    });

    it('should ignore stale off-scope face links when applying taken-date filters', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: targetSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: targetAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-02-15T00:00:00.000Z'),
      });
      const { asset: otherSpaceAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-03-15T00:00:00.000Z'),
      });
      await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: targetAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherSpaceAsset.id });
      const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: targetAsset.id });
      const { assetFace: offScopeMatchingDateFace } = await ctx.newAssetFace({ assetId: otherSpaceAsset.id });
      const person = await sut.createPerson({
        spaceId: targetSpace.id,
        name: 'Alice',
        representativeFaceId: targetFace.id,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: targetFace.id },
          { personId: person.id, assetFaceId: offScopeMatchingDateFace.id },
        ],
        { skipRecount: true },
      );

      const query = {
        takenAfter: new Date('2024-03-01T00:00:00.000Z'),
        takenBefore: new Date('2024-04-01T00:00:00.000Z'),
      };

      await expect(sut.getPersonsBySpaceId(targetSpace.id, query)).resolves.toEqual([]);
      await expect(sut.countPersonsBySpaceId(targetSpace.id, query)).resolves.toEqual({
        total: 0,
        hidden: 0,
        detectedFaceCount: 0,
      });
    });
  });

  describe('countPersonsBySpaceId', () => {
    it('should count total and hidden people with name and pet filters', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: aliciaFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: petFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id });

      const alice = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: null,
        type: 'person',
      });
      const alicia = await sut.createPerson({
        spaceId: space.id,
        name: 'Alicia',
        representativeFaceId: null,
        isHidden: true,
        type: 'person',
      });
      const alicePet = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice Pet',
        representativeFaceId: null,
        isHidden: true,
        type: 'pet',
      });
      const bob = await sut.createPerson({
        spaceId: space.id,
        name: 'Bob',
        representativeFaceId: null,
        type: 'person',
      });
      await sut.addPersonFaces(
        [
          { personId: alice.id, assetFaceId: aliceFace.id },
          { personId: alicia.id, assetFaceId: aliciaFace.id },
          { personId: alicePet.id, assetFaceId: petFace.id },
          { personId: bob.id, assetFaceId: bobFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(space.id, { name: 'Ali', petsEnabled: false });

      expect(Number(result.total)).toBe(2);
      expect(Number(result.hidden)).toBe(1);
      expect(Number(result.detectedFaceCount)).toBe(2);
    });

    it('should return zero counts for an empty shared space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      const result = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.total)).toBe(0);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(0);
    });

    it('should isolate people and faces to the selected shared space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space: targetSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: targetAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: targetAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id });
      const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: targetAsset.id });
      const { assetFace: otherFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
      const targetPerson = await sut.createPerson({
        spaceId: targetSpace.id,
        name: 'Target',
        representativeFaceId: null,
      });
      const otherPerson = await sut.createPerson({ spaceId: otherSpace.id, name: 'Other', representativeFaceId: null });
      await sut.addPersonFaces(
        [
          { personId: targetPerson.id, assetFaceId: targetFace.id },
          { personId: otherPerson.id, assetFaceId: otherFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(targetSpace.id, {});

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(1);
    });

    it('should count direct and linked-library asset faces in the selected space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
      const { asset: directAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: linkedAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Archive,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directAsset.id });
      const { assetFace: directFace } = await ctx.newAssetFace({ assetId: directAsset.id });
      const { assetFace: linkedFace } = await ctx.newAssetFace({ assetId: linkedAsset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: directFace.id },
          { personId: person.id, assetFaceId: linkedFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(2);
    });

    it('should count one identity person and two faces from multiple space assets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: firstAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: firstAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: secondAsset.id });
      const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: firstAsset.id });
      const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: secondAsset.id });
      const identity = await ctx.database
        .insertInto('face_identity')
        .values({ representativeFaceId: firstFace.id })
        .returningAll()
        .executeTakeFirstOrThrow();
      const person = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: firstFace.id,
        identityId: identity.id,
      });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: firstFace.id },
          { personId: person.id, assetFaceId: secondFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(2);
    });

    it('should count unnamed space persons only when they meet the minimum face count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const assets = await Promise.all(
        Array.from({ length: 6 }).map(() => ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline })),
      );
      for (const { asset } of assets) {
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      }
      const faces = [];
      for (const { asset } of assets) {
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
        faces.push(assetFace);
      }
      const namedSingleFace = await sut.createPerson({
        spaceId: space.id,
        name: 'Named',
        representativeFaceId: faces[0].id,
      });
      const unnamedLowEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[1].id,
      });
      const unnamedEnoughEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[3].id,
      });
      await sut.addPersonFaces([
        { personId: namedSingleFace.id, assetFaceId: faces[0].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[1].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[2].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[3].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[4].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[5].id },
      ]);

      const result = await sut.countPersonsBySpaceId(space.id, { minimumFaceCount: 3 });

      expect(Number(result.total)).toBe(2);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(6);
    });

    it('should count a face reachable directly and through a linked library once', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: assetFace.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: assetFace.id }], { skipRecount: true });

      const result = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(1);
    });

    it('should exclude invalid assets and non-visible or deleted face rows from detected face count', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const assets = await Promise.all([
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, deletedAt: new Date(), visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, isOffline: true, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
      ]);
      for (const { asset } of assets) {
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      }
      const { assetFace: validFace } = await ctx.newAssetFace({ assetId: assets[0].asset.id });
      await ctx.newAssetFace({ assetId: assets[1].asset.id });
      await ctx.newAssetFace({ assetId: assets[2].asset.id });
      await ctx.newAssetFace({ assetId: assets[3].asset.id });
      await ctx.newAssetFace({ assetId: assets[4].asset.id, isVisible: false });
      const { assetFace: deletedFace } = await ctx.newAssetFace({ assetId: assets[5].asset.id });
      await ctx.database
        .updateTable('asset_face')
        .set({ deletedAt: new Date() })
        .where('id', '=', deletedFace.id)
        .execute();
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: validFace.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: validFace.id }], { skipRecount: true });

      const result = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(1);
    });

    it('should count only assigned matching-person faces for a name filter', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });
      const alice = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: aliceFace.id });
      const bob = await sut.createPerson({ spaceId: space.id, name: 'Bob', representativeFaceId: bobFace.id });
      await sut.addPersonFaces(
        [
          { personId: alice.id, assetFaceId: aliceFace.id },
          { personId: bob.id, assetFaceId: bobFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(space.id, { name: 'Ali' });

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(1);
    });

    it('should count assigned and unassigned faces on assets matching a taken-date filter', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: matchingAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-03-15T12:00:00.000Z'),
        localDateTime: new Date('2024-03-15T12:00:00.000Z'),
      });
      const { asset: nonMatchingAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-04-15T12:00:00.000Z'),
        localDateTime: new Date('2024-04-15T12:00:00.000Z'),
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: matchingAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: nonMatchingAsset.id });
      const { assetFace: assignedFace } = await ctx.newAssetFace({ assetId: matchingAsset.id });
      await ctx.newAssetFace({ assetId: matchingAsset.id });
      const { assetFace: nonMatchingFace } = await ctx.newAssetFace({ assetId: nonMatchingAsset.id });
      const person = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: assignedFace.id,
      });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: assignedFace.id },
          { personId: person.id, assetFaceId: nonMatchingFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.countPersonsBySpaceId(space.id, {
        takenAfter: new Date('2024-03-01T00:00:00.000Z'),
        takenBefore: new Date('2024-04-01T00:00:00.000Z'),
      });

      expect(Number(result.total)).toBe(1);
      expect(Number(result.hidden)).toBe(0);
      expect(Number(result.detectedFaceCount)).toBe(2);
    });
  });

  describe('getSpacePersonStatistics', () => {
    it('counts direct shared-space assets and visible faces for the selected person', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
      const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: asset.id });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: firstFace.id },
          { personId: person.id, assetFaceId: secondFace.id },
        ],
        { skipRecount: true },
      );

      await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 2 });
    });

    it('counts linked-library assets only when the library is linked to the selected space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });

      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const { asset: linkedAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      const { assetFace: linkedFace } = await ctx.newAssetFace({ assetId: linkedAsset.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: linkedFace.id }], { skipRecount: true });

      await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 1 });
      await expect(sut.getSpacePersonStatistics(otherSpace.id, person.id)).resolves.toEqual({ assets: 0, faces: 0 });
    });

    it('counts a selected-space face once when it is reachable directly and through a linked library', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: assetFace.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: assetFace.id }], { skipRecount: true });

      await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 1 });
    });

    it('does not count identity-linked faces that are not assigned to the selected space person', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const identity = await ctx.database
        .insertInto('face_identity')
        .values({ type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();
      const person = await ctx.database
        .insertInto('shared_space_person')
        .values({ spaceId: space.id, identityId: identity.id, name: 'Alice', type: 'person' })
        .returningAll()
        .executeTakeFirstOrThrow();

      const { asset: assignedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assignedAsset.id, addedById: user.id });
      const { assetFace: assignedFace } = await ctx.newAssetFace({ assetId: assignedAsset.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: assignedFace.id }], { skipRecount: true });

      const { asset: identityOnlyAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: identityOnlyAsset.id, addedById: user.id });
      const { assetFace: identityOnlyFace } = await ctx.newAssetFace({ assetId: identityOnlyAsset.id });
      await ctx.database
        .insertInto('face_identity_face')
        .values({ identityId: identity.id, assetFaceId: identityOnlyFace.id, source: 'shared-space-evidence' })
        .execute();

      await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 1 });
    });

    it('keeps space person detail statistics stable across asset and face materialization order', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: assetBeforePerson } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetBeforePerson.id, addedById: user.id });
      const { assetFace: faceBeforePerson } = await ctx.newAssetFace({ assetId: assetBeforePerson.id });
      const personCreatedAfterAsset = await sut.createPerson({
        spaceId: space.id,
        name: 'After Asset',
        representativeFaceId: faceBeforePerson.id,
      });
      await sut.addPersonFaces([{ personId: personCreatedAfterAsset.id, assetFaceId: faceBeforePerson.id }], {
        skipRecount: true,
      });

      const personCreatedBeforeAsset = await sut.createPerson({
        spaceId: space.id,
        name: 'Before Asset',
        representativeFaceId: null,
      });
      const { asset: assetAfterPerson } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
      });
      const { assetFace: faceAfterPerson } = await ctx.newAssetFace({ assetId: assetAfterPerson.id });
      await sut.addPersonFaces([{ personId: personCreatedBeforeAsset.id, assetFaceId: faceAfterPerson.id }], {
        skipRecount: true,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetAfterPerson.id, addedById: user.id });

      await expect(sut.getSpacePersonStatistics(space.id, personCreatedAfterAsset.id)).resolves.toEqual({
        assets: 1,
        faces: 1,
      });
      await expect(sut.getSpacePersonStatistics(space.id, personCreatedBeforeAsset.id)).resolves.toEqual({
        assets: 1,
        faces: 1,
      });
    });
  });

  describe('getPeopleFaceStatisticsBySpaceId', () => {
    it('getPeopleFaceStatisticsBySpaceId splits selected-space faces into visible, hidden, and unassigned buckets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: hiddenFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });
      const visiblePerson = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const hiddenPerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Bob',
        isHidden: true,
        representativeFaceId: null,
      });
      await sut.addPersonFaces(
        [
          { personId: visiblePerson.id, assetFaceId: visibleFace.id },
          { personId: hiddenPerson.id, assetFaceId: hiddenFace.id },
        ],
        { skipRecount: true },
      );

      const result = await sut.getPeopleFaceStatisticsBySpaceId(space.id, {});
      const overview = await sut.countPersonsBySpaceId(space.id, {});

      expect(Number(result.detectedFaceCount)).toBe(Number(overview.detectedFaceCount));
      expectStats(result, {
        detectedFaceCount: 3,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 1,
      });
      expect(
        Number(result.assignedVisibleFaceCount) +
          Number(result.assignedHiddenFaceCount) +
          Number(result.unassignedFaceCount),
      ).toBe(Number(result.detectedFaceCount));
    });

    it('getPeopleFaceStatisticsBySpaceId returns zeroes for an empty shared space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, {}), {
        detectedFaceCount: 0,
        assignedVisibleFaceCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId isolates detailed counts to the selected shared space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: otherFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Target', representativeFaceId: null });
      const otherPerson = await sut.createPerson({ spaceId: otherSpace.id, name: 'Other', representativeFaceId: null });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: assetFace.id },
          { personId: otherPerson.id, assetFaceId: otherFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, {}), {
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId counts direct and linked-library faces once in selected space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
      const { asset: directAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: linkedAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Archive,
      });
      const { asset: duplicateAsset } = await ctx.newAsset({
        ownerId: user.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: duplicateAsset.id });
      const { assetFace: directFace } = await ctx.newAssetFace({ assetId: directAsset.id });
      const { assetFace: linkedFace } = await ctx.newAssetFace({ assetId: linkedAsset.id });
      const { assetFace: duplicateFace } = await ctx.newAssetFace({ assetId: duplicateAsset.id });
      const visiblePerson = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const hiddenPerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Bob',
        isHidden: true,
        representativeFaceId: null,
      });
      await sut.addPersonFaces(
        [
          { personId: visiblePerson.id, assetFaceId: directFace.id },
          { personId: visiblePerson.id, assetFaceId: linkedFace.id },
          { personId: hiddenPerson.id, assetFaceId: duplicateFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, {}), {
        detectedFaceCount: 3,
        assignedVisibleFaceCount: 2,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId excludes invalid selected-space assets and face rows', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const assets = await Promise.all([
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, deletedAt: new Date(), visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, isOffline: true, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
      ]);
      for (const { asset } of assets) {
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      }
      const { assetFace: validFace } = await ctx.newAssetFace({ assetId: assets[0].asset.id });
      await ctx.newAssetFace({ assetId: assets[1].asset.id });
      await ctx.newAssetFace({ assetId: assets[2].asset.id });
      await ctx.newAssetFace({ assetId: assets[3].asset.id });
      await ctx.newAssetFace({ assetId: assets[4].asset.id, isVisible: false });
      await ctx.newAssetFace({ assetId: assets[5].asset.id, deletedAt: new Date() });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: validFace.id });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: validFace.id }], { skipRecount: true });

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, {}), {
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId name filter counts only assigned matching-person faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });
      const alice = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: aliceFace.id });
      const bob = await sut.createPerson({ spaceId: space.id, name: 'Bob', representativeFaceId: bobFace.id });
      await sut.addPersonFaces(
        [
          { personId: alice.id, assetFaceId: aliceFace.id },
          { personId: bob.id, assetFaceId: bobFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { name: 'Ali' }), {
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId named filter counts only assigned named-person faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace: namedFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: unnamedFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });
      const namedPerson = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const unnamedPerson = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: null });
      await sut.addPersonFaces(
        [
          { personId: namedPerson.id, assetFaceId: namedFace.id },
          { personId: unnamedPerson.id, assetFaceId: unnamedFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { named: true }), {
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId counts distinct named visible people in the selected space scope', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { asset: otherAsset } = await ctx.newAsset({ ownerId: otherUser.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id });

      const { assetFace: namedFaceA } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: namedFaceB } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: hiddenFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: unnamedFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: whitespaceFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: otherSpaceFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
      const namedPerson = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const otherNamedPerson = await sut.createPerson({ spaceId: space.id, name: 'Bob', representativeFaceId: null });
      const hiddenPerson = await sut.createPerson({
        spaceId: space.id,
        name: 'Hidden',
        isHidden: true,
        representativeFaceId: null,
      });
      const unnamedPerson = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: null });
      const whitespacePerson = await sut.createPerson({ spaceId: space.id, name: '   ', representativeFaceId: null });
      const outOfScopePerson = await sut.createPerson({
        spaceId: otherSpace.id,
        name: 'Other Space',
        representativeFaceId: null,
      });
      await sut.addPersonFaces(
        [
          { personId: namedPerson.id, assetFaceId: namedFaceA.id },
          { personId: namedPerson.id, assetFaceId: namedFaceB.id },
          { personId: otherNamedPerson.id, assetFaceId: namedFaceB.id },
          { personId: hiddenPerson.id, assetFaceId: hiddenFace.id },
          { personId: unnamedPerson.id, assetFaceId: unnamedFace.id },
          { personId: whitespacePerson.id, assetFaceId: whitespaceFace.id },
          { personId: outOfScopePerson.id, assetFaceId: otherSpaceFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, {}), {
        detectedFaceCount: 5,
        assignedVisibleFaceCount: 4,
        namedVisiblePersonCount: 2,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 0,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId taken-date filter counts assigned and unassigned matching-date faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset: matchingAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-03-15T12:00:00.000Z'),
        localDateTime: new Date('2024-03-15T12:00:00.000Z'),
      });
      const { asset: nonMatchingAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-04-15T12:00:00.000Z'),
        localDateTime: new Date('2024-04-15T12:00:00.000Z'),
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: matchingAsset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: nonMatchingAsset.id });
      const { assetFace: assignedFace } = await ctx.newAssetFace({ assetId: matchingAsset.id });
      await ctx.newAssetFace({ assetId: matchingAsset.id });
      const { assetFace: nonMatchingFace } = await ctx.newAssetFace({ assetId: nonMatchingAsset.id });
      const person = await sut.createPerson({
        spaceId: space.id,
        name: 'Alice',
        representativeFaceId: assignedFace.id,
      });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: assignedFace.id },
          { personId: person.id, assetFaceId: nonMatchingFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(
        await sut.getPeopleFaceStatisticsBySpaceId(space.id, {
          takenAfter: new Date('2024-03-01T00:00:00.000Z'),
          takenBefore: new Date('2024-04-01T00:00:00.000Z'),
        }),
        { detectedFaceCount: 2, assignedVisibleFaceCount: 1, assignedHiddenFaceCount: 0, unassignedFaceCount: 1 },
      );
    });

    it('getPeopleFaceStatisticsBySpaceId ignores stale off-scope face links when applying taken-date filters', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-02-15T00:00:00.000Z'),
      });
      const { asset: otherAsset } = await ctx.newAsset({
        ownerId: user.id,
        visibility: AssetVisibility.Timeline,
        fileCreatedAt: new Date('2024-03-15T00:00:00.000Z'),
      });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id });
      const { assetFace: face } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: offScopeMatchingDateFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: face.id });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: face.id },
          { personId: person.id, assetFaceId: offScopeMatchingDateFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(
        await sut.getPeopleFaceStatisticsBySpaceId(space.id, {
          takenAfter: new Date('2024-03-01T00:00:00.000Z'),
          takenBefore: new Date('2024-04-01T00:00:00.000Z'),
        }),
        { detectedFaceCount: 0, assignedVisibleFaceCount: 0, assignedHiddenFaceCount: 0, unassignedFaceCount: 0 },
      );
    });

    it('getPeopleFaceStatisticsBySpaceId pets disabled excludes pet-assigned faces and preserves unassigned faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const { assetFace: personFace } = await ctx.newAssetFace({ assetId: asset.id });
      const { assetFace: petFace } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });
      const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
      const pet = await sut.createPerson({ spaceId: space.id, name: 'Fido', type: 'pet', representativeFaceId: null });
      await sut.addPersonFaces(
        [
          { personId: person.id, assetFaceId: personFace.id },
          { personId: pet.id, assetFaceId: petFace.id },
        ],
        { skipRecount: true },
      );

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { petsEnabled: false }), {
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 1,
      });
    });

    it('getPeopleFaceStatisticsBySpaceId treats below-threshold unnamed assignments as unassigned', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const assets = await Promise.all(
        Array.from({ length: 6 }).map(() => ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline })),
      );
      for (const { asset } of assets) {
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      }
      const faces = [];
      for (const { asset } of assets) {
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
        faces.push(assetFace);
      }

      const namedSingleFace = await sut.createPerson({
        spaceId: space.id,
        name: 'Named',
        representativeFaceId: faces[0].id,
      });
      const unnamedLowEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[1].id,
      });
      const unnamedEnoughEvidence = await sut.createPerson({
        spaceId: space.id,
        name: '',
        representativeFaceId: faces[3].id,
      });
      await sut.addPersonFaces([
        { personId: namedSingleFace.id, assetFaceId: faces[0].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[1].id },
        { personId: unnamedLowEvidence.id, assetFaceId: faces[2].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[3].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[4].id },
        { personId: unnamedEnoughEvidence.id, assetFaceId: faces[5].id },
      ]);

      expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 3 }), {
        detectedFaceCount: 6,
        assignedVisibleFaceCount: 4,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 2,
      });
    });
  });

  describe('representative face picker queries', () => {
    it('does not repair valid manual representative faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const person = await sut.createPerson({
        spaceId: space.id,
        representativeFaceId: faceId,
        representativeFaceSource: 'manual',
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: faceId }]);

      await sut.repairInvalidRepresentativeFaces(space.id);

      await expect(sut.getPersonById(person.id)).resolves.toMatchObject({
        representativeFaceId: faceId,
        representativeFaceSource: 'manual',
      });
    });

    it('requires representative picker faces to belong to assets in the space', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id });
      const person = await sut.createPerson({ spaceId: space.id, type: 'person', representativeFaceId: faceId });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: faceId }]);

      await expect(
        sut.getSpaceRepresentativeFaceForUpdate({ spaceId: space.id, personId: person.id, assetFaceId: faceId }),
      ).resolves.toBeUndefined();

      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      await expect(
        sut.getSpaceRepresentativeFaceForUpdate({ spaceId: space.id, personId: person.id, assetFaceId: faceId }),
      ).resolves.toMatchObject({ id: faceId, assetId: asset.id });
    });

    it('includes library-backed space assets in the representative face list', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { library } = await ctx.newLibrary({ ownerId: user.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
      const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id });
      const person = await sut.createPerson({ spaceId: space.id, type: 'person', representativeFaceId: faceId });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: faceId }]);

      const rows = await sut.getSpaceRepresentativeFaces({ spaceId: space.id, personId: person.id, take: 10, skip: 0 });

      expect(rows).toEqual([expect.objectContaining({ id: faceId, assetId: asset.id })]);
    });

    const invalidators: Array<
      [string, (ctx: any, faceId: string, assetId: string, spaceId: string, personId: string) => Promise<void>]
    > = [
      [
        'hidden face',
        async (ctx, faceId) => {
          await ctx.database.updateTable('asset_face').set({ isVisible: false }).where('id', '=', faceId).execute();
        },
      ],
      [
        'deleted face',
        async (ctx, faceId) => {
          await ctx.database
            .updateTable('asset_face')
            .set({ deletedAt: new Date() })
            .where('id', '=', faceId)
            .execute();
        },
      ],
      [
        'offline asset',
        async (ctx, _faceId, assetId) => {
          await ctx.database.updateTable('asset').set({ isOffline: true }).where('id', '=', assetId).execute();
        },
      ],
      [
        'deleted asset',
        async (ctx, _faceId, assetId) => {
          await ctx.database.updateTable('asset').set({ deletedAt: new Date() }).where('id', '=', assetId).execute();
        },
      ],
      [
        'hidden asset',
        async (ctx, _faceId, assetId) => {
          await ctx.database
            .updateTable('asset')
            .set({ visibility: AssetVisibility.Hidden })
            .where('id', '=', assetId)
            .execute();
        },
      ],
      [
        'asset removed from space',
        async (ctx, _faceId, assetId, spaceId) => {
          await ctx.database
            .deleteFrom('shared_space_asset')
            .where('spaceId', '=', spaceId)
            .where('assetId', '=', assetId)
            .execute();
        },
      ],
      [
        'face no longer assigned to the space person',
        async (ctx, faceId, _assetId, _spaceId, personId) => {
          await ctx.database
            .deleteFrom('shared_space_person_face')
            .where('personId', '=', personId)
            .where('assetFaceId', '=', faceId)
            .execute();
        },
      ],
    ];

    it.each(invalidators)('clears invalid manual representative face when %s', async (_label, invalidate) => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: faceId } = await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
      const person = await sut.createPerson({
        spaceId: space.id,
        representativeFaceId: faceId,
        representativeFaceSource: 'manual',
        type: 'person',
      });
      await sut.addPersonFaces([{ personId: person.id, assetFaceId: faceId }]);
      await invalidate(ctx, faceId, asset.id, space.id, person.id);

      await sut.repairInvalidRepresentativeFaces(space.id);

      await expect(sut.getPersonById(person.id)).resolves.toMatchObject({
        representativeFaceId: null,
        representativeFaceSource: 'auto',
      });
    });
  });

  describe('getFilteredMapMarkers — space filter interaction', () => {
    it('should include tagged space assets when tagIds filter is applied with timelineSpaceIds', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 10, longitude: 10 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      // Create a tag owned by the owner and attach it to the asset
      const tag = await ctx.database
        .insertInto('tag')
        .values({ value: 'landscape', userId: owner.id, parentId: null })
        .returningAll()
        .executeTakeFirstOrThrow();
      await ctx.database.insertInto('tag_closure').values({ id_ancestor: tag.id, id_descendant: tag.id }).execute();
      await ctx.database.insertInto('tag_asset').values({ tagId: tag.id, assetId: asset.id }).execute();

      const results = await sut.getFilteredMapMarkers({
        userIds: [member.id],
        timelineSpaceIds: [space.id],
        tagIds: [tag.id],
        tagMatchAny: true,
        visibility: AssetVisibility.Timeline,
      });

      expect(results.find((r) => r.id === asset.id)).toBeDefined();
    });

    it('should filter space assets by owner-set rating', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database
        .insertInto('asset_exif')
        .values({ assetId: asset.id, latitude: 11, longitude: 11, rating: 5 })
        .execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const matching = await sut.getFilteredMapMarkers({
        userIds: [member.id],
        timelineSpaceIds: [space.id],
        rating: 5,
        visibility: AssetVisibility.Timeline,
      });
      expect(matching.find((r) => r.id === asset.id)).toBeDefined();

      const nonMatching = await sut.getFilteredMapMarkers({
        userIds: [member.id],
        timelineSpaceIds: [space.id],
        rating: 1,
        visibility: AssetVisibility.Timeline,
      });
      expect(nonMatching.find((r) => r.id === asset.id)).toBeUndefined();
    });
  });

  describe('getFilteredMapMarkers — space membership inclusion', () => {
    it('should include a direct shared_space_asset via timelineSpaceIds (row 2)', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 20, longitude: 20 }).execute();
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });

      const results = await sut.getFilteredMapMarkers({
        userIds: [member.id],
        timelineSpaceIds: [space.id],
        visibility: AssetVisibility.Timeline,
      });

      expect(results.find((r) => r.id === asset.id)).toBeDefined();
    });

    it('should include a library-linked asset via timelineSpaceIds (row 4)', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id });
      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
      const { asset } = await ctx.newAsset({
        ownerId: owner.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      await ctx.database.insertInto('asset_exif').values({ assetId: asset.id, latitude: 21, longitude: 21 }).execute();

      const results = await sut.getFilteredMapMarkers({
        userIds: [member.id],
        timelineSpaceIds: [space.id],
        visibility: AssetVisibility.Timeline,
      });

      expect(results.find((r) => r.id === asset.id)).toBeDefined();
    });
  });
});
