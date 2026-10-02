import { Kysely } from 'kysely';
import { ReactionLevel, ReactionType, buildAssetAdditionId } from 'src/dtos/activity.dto.js';
import { AssetType, AssetVisibility } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { ActivityRepository } from 'src/repositories/activity.repository.js';
import { AlbumUserRepository } from 'src/repositories/album-user.repository.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { ActivityService } from 'src/services/activity.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory, newUuid } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(ActivityService, {
    database: db || defaultDatabase,
    real: [AccessRepository, ActivityRepository, AlbumRepository, AlbumUserRepository, AssetRepository, UserRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(ActivityService.name, () => {
  describe('getAll', () => {
    it('should start off empty', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();

      await expect(sut.getAll(factory.auth({ user: owner }), { albumId: album.id })).resolves.toEqual([]);
    });

    it('should filter by album id', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { album: other } = await ctx.newAlbum({ ownerId: owner.id });
      const { value } = await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });
      await sut.create(auth, { albumId: other.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([value]);
    });

    it('should filter by type=comment', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'comment',
      });
      await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id, type: ReactionType.COMMENT })).resolves.toEqual([value]);
    });

    it('should filter by type=like', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });
      await sut.create(auth, { albumId: album.id, type: ReactionType.COMMENT, comment: 'comment' });

      await expect(sut.getAll(auth, { albumId: album.id, type: ReactionType.LIKE })).resolves.toEqual([value]);
    });

    it('should filter by userId', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id, userId: newUuid() })).resolves.toEqual([]);
      await expect(sut.getAll(auth, { albumId: album.id, userId: owner.id })).resolves.toEqual([value]);
    });

    it('should filter by assetId', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.LIKE,
      });
      await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id, assetId: asset.id })).resolves.toEqual([value]);
    });
  });

  describe('getAll asset additions', () => {
    it('should not include asset additions by default', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });

      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
      await expect(sut.getAll(auth, { albumId: album.id, withAdditions: false })).resolves.toEqual([]);
    });

    it('should merge asset additions with reactions in chronological order', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value: comment } = await sut.create(auth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'comment',
      });
      const { value: like } = await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id, withAdditions: true })).resolves.toEqual([
        {
          id: buildAssetAdditionId(album.id, asset.id),
          assetId: asset.id,
          assetType: AssetType.Image,
          createdAt: expect.any(Date),
          comment: null,
          type: ReactionType.ASSET_ADDED,
          groupId: expect.any(String),
          user: expect.objectContaining({ id: owner.id }),
        },
        comment,
        like,
      ]);
    });

    it('should only return asset additions for type=asset_added', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.getAll(auth, { albumId: album.id, type: ReactionType.ASSET_ADDED })).resolves.toEqual([
        expect.objectContaining({ assetId: asset.id, type: ReactionType.ASSET_ADDED }),
      ]);
    });

    it('should scope asset additions appropriately', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner, sharedWith } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const addition = expect.objectContaining({ assetId: asset.id, type: ReactionType.ASSET_ADDED });

      await expect(sut.getAll(auth, { albumId: album.id, assetId: asset.id, withAdditions: true })).resolves.toEqual(
        [],
      );
      await expect(
        sut.getAll(auth, { albumId: album.id, level: ReactionLevel.ALBUM, withAdditions: true }),
      ).resolves.toEqual([addition]);
      await expect(
        sut.getAll(auth, { albumId: album.id, type: ReactionType.ASSET_ADDED, userId: owner.id }),
      ).resolves.toEqual([addition]);
      await expect(
        sut.getAll(auth, { albumId: album.id, type: ReactionType.ASSET_ADDED, userId: sharedWith.id }),
      ).resolves.toEqual([]);
    });

    it('should exclude assets that were deleted, locked, or from deleted owners', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { user: deletedOwner } = await ctx.newUser();
      const { asset: deletedAsset } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: lockedAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Locked });
      const { asset: orphanedAsset } = await ctx.newAsset({ ownerId: deletedOwner.id });
      for (const { id } of [deletedAsset, lockedAsset, orphanedAsset]) {
        await ctx.newAlbumAsset({ albumId: album.id, assetId: id });
      }
      await ctx.softDeleteAsset(deletedAsset.id);
      await defaultDatabase
        .updateTable('user')
        .set({ deletedAt: new Date() })
        .where('id', '=', deletedOwner.id)
        .execute();

      await expect(sut.getAll(auth, { albumId: album.id, type: ReactionType.ASSET_ADDED })).resolves.toEqual([
        expect.objectContaining({ assetId: asset.id }),
      ]);
    });

    it('should share a groupId between assets added together', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id, fileCreatedAt: new Date('2020-01-01') });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id, fileCreatedAt: new Date('2020-01-02') });
      const { asset: asset3 } = await ctx.newAsset({ ownerId: user.id });
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [asset2.id, asset1.id]);
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset3.id });

      const additions = await sut.getAll(auth, { albumId: album.id, type: ReactionType.ASSET_ADDED });

      expect(additions.map(({ assetId }) => assetId)).toEqual([asset1.id, asset2.id, asset3.id]);
      expect(additions[0].groupId).toEqual(additions[1].groupId);
      expect(additions[2].groupId).not.toEqual(additions[0].groupId);
    });
  });

  describe('create', () => {
    it('should add a comment to an album', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });

      await expect(
        sut.create(auth, { albumId: album.id, type: ReactionType.COMMENT, comment: 'This is my first comment' }),
      ).resolves.toEqual({
        duplicate: false,
        value: {
          id: expect.any(String),
          assetId: null,
          createdAt: expect.any(Date),
          type: ReactionType.COMMENT,
          comment: 'This is my first comment',
          user: expect.objectContaining({ id: owner.id }),
        },
      });
    });

    it('should add a like to an album', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });

      await expect(sut.create(auth, { albumId: album.id, type: ReactionType.LIKE })).resolves.toEqual({
        duplicate: false,
        value: {
          id: expect.any(String),
          assetId: null,
          createdAt: expect.any(Date),
          type: ReactionType.LIKE,
          comment: null,
          user: expect.objectContaining({ id: owner.id }),
        },
      });
    });

    it('should report a duplicate like on an album', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const ownerAuth = factory.auth({ user: owner });
      const { value } = await sut.create(ownerAuth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.create(ownerAuth, { albumId: album.id, type: ReactionType.LIKE })).resolves.toEqual({
        duplicate: true,
        value,
      });
    });

    it('should not confuse an album like with an asset like', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const ownerAuth = factory.auth({ user: owner });
      const { value } = await sut.create(ownerAuth, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.LIKE,
      });

      const result = await sut.create(ownerAuth, { albumId: album.id, type: ReactionType.LIKE });

      expect(result.duplicate).toBe(false);
      expect(result.value.id).not.toEqual(value.id);
    });

    it('should add a comment to an asset', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();

      await expect(
        sut.create(factory.auth({ user: owner }), {
          albumId: album.id,
          assetId: asset.id,
          type: ReactionType.COMMENT,
          comment: 'This is my first comment',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          duplicate: false,
          value: expect.objectContaining({ assetId: asset.id, comment: 'This is my first comment' }),
        }),
      );
    });

    it('should add a like to an asset', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();

      await expect(
        sut.create(factory.auth({ user: owner }), { albumId: album.id, assetId: asset.id, type: ReactionType.LIKE }),
      ).resolves.toEqual(
        expect.objectContaining({
          duplicate: false,
          value: expect.objectContaining({ assetId: asset.id, type: ReactionType.LIKE, comment: null }),
        }),
      );
    });

    it('should report a duplicate like on an asset', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.LIKE,
      });

      await expect(
        sut.create(auth, { albumId: album.id, assetId: asset.id, type: ReactionType.LIKE }),
      ).resolves.toEqual({ duplicate: true, value });
    });

    it('should not let a user comment on an album they cannot access', async () => {
      const { sut, ctx } = setup();
      const { album } = await ctx.newSharedAlbum();
      const { user: outsider } = await ctx.newUser();

      await expect(
        sut.create(factory.auth({ user: outsider }), { albumId: album.id, type: ReactionType.LIKE }),
      ).rejects.toThrow('Not found or no activity.create access');
    });
  });

  describe('delete', () => {
    it('should remove a comment from an album', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      await expect(sut.delete(auth, value.id)).resolves.toBeUndefined();
      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
    });

    it('should remove a like from an album', async () => {
      const { sut, ctx } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const { value } = await sut.create(auth, { albumId: album.id, type: ReactionType.LIKE });

      await expect(sut.delete(auth, value.id)).resolves.toBeUndefined();
      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
    });

    it('should let the album owner remove a comment by another user', async () => {
      const { sut, ctx } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const sharedWithAuth = factory.auth({ user: sharedWith });
      const { value } = await sut.create(sharedWithAuth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      await expect(sut.delete(auth, value.id)).resolves.toBeUndefined();
      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
    });

    it('should not let a user remove a comment by another user', async () => {
      const { sut, ctx } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const sharedWithAuth = factory.auth({ user: sharedWith });
      const { value } = await sut.create(auth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      await expect(sut.delete(sharedWithAuth, value.id)).rejects.toThrow('Not found or no activity.delete access');
      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([value]);
    });

    it('should let a non-owner remove their own comment', async () => {
      const { sut, ctx } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      const sharedWithAuth = factory.auth({ user: sharedWith });
      const { value } = await sut.create(sharedWithAuth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'This is a test comment',
      });

      await expect(sut.delete(sharedWithAuth, value.id)).resolves.toBeUndefined();
      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
    });

    it('should drop activities when the asset is removed from the album', async () => {
      const { sut, ctx } = setup();
      const { album, asset, owner } = await ctx.newSharedAlbum();
      const auth = factory.auth({ user: owner });
      await sut.create(auth, { albumId: album.id, assetId: asset.id, type: ReactionType.LIKE });

      await ctx.database
        .deleteFrom('album_asset')
        .where('albumId', '=', album.id)
        .where('assetId', '=', asset.id)
        .execute();

      await expect(sut.getAll(auth, { albumId: album.id })).resolves.toEqual([]);
    });
  });
});
