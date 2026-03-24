import { Kysely } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
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
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });
      const { asset: asset3 } = await ctx.newAsset({ ownerId: user.id });

      // Add assets with slight delay to ensure ordering
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
});
