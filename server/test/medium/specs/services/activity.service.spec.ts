import { Kysely } from 'kysely';
import { buildAssetAdditionId, ReactionType } from 'src/dtos/activity.dto';
import { AlbumUserRole, AssetType, AssetVisibility } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { ActivityService } from 'src/services/activity.service';
import { newMediumService } from 'test/medium.factory';
import { factory, newUuid } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(ActivityService, {
    database: db || defaultDatabase,
    real: [AccessRepository, ActivityRepository, AlbumRepository, AlbumUserRepository, AssetRepository, UserRepository],
    mock: [LoggingRepository],
  });
};

const setAlbumAssetCreatedAt = async (
  db: Kysely<DB>,
  { albumId, assetId, createdAt }: { albumId: string; assetId: string; createdAt: Date },
) => {
  await db
    .updateTable('album_asset')
    .set({ createdAt })
    .where('albumId', '=', albumId)
    .where('assetId', '=', assetId)
    .execute();
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

    it('should attribute an asset addition to the user who added it', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: editor } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: editor.id, role: AlbumUserRole.Editor });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: editor.id });

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result).toEqual([
        expect.objectContaining({
          id: buildAssetAdditionId(album.id, asset.id),
          type: ReactionType.ASSET_ADDED,
          assetId: asset.id,
          assetType: AssetType.Image,
          comment: null,
          user: expect.objectContaining({ id: editor.id }),
        }),
      ]);
    });

    it('should attribute a legacy addition (null createdById) to the asset owner', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id });

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result).toEqual([expect.objectContaining({ user: expect.objectContaining({ id: owner.id }) })]);
    });

    it('should exclude trashed assets', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      await ctx.softDeleteAsset(asset.id);

      await expect(
        sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true }),
      ).resolves.toEqual([]);
    });

    it('should exclude locked assets', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      await ctx.database
        .updateTable('asset')
        .set({ visibility: AssetVisibility.Locked })
        .where('id', '=', asset.id)
        .execute();

      await expect(
        sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true }),
      ).resolves.toEqual([]);
    });

    it('should fall back to the asset owner when the adding user is soft-deleted', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: other.id });
      await ctx.database.updateTable('user').set({ deletedAt: new Date() }).where('id', '=', other.id).execute();

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result).toEqual([expect.objectContaining({ user: expect.objectContaining({ id: owner.id }) })]);
    });

    it('should fall back to the asset owner when the adding user is hard-deleted', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: other.id });
      await ctx.database.deleteFrom('user').where('id', '=', other.id).execute();

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result).toEqual([expect.objectContaining({ user: expect.objectContaining({ id: owner.id }) })]);
    });

    it('should keep the original adder and date when an asset is copied', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: editor } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: editor.id, role: AlbumUserRole.Editor });
      const { asset: source } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: target } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: source.id, createdById: editor.id });
      const auth = factory.auth({ user: owner });
      const [original] = await sut.getAll(auth, { albumId: album.id, withAdditions: true });

      await ctx.get(AlbumRepository).copyAlbums({ sourceAssetId: source.id, targetAssetId: target.id });

      const result = await sut.getAll(auth, { albumId: album.id, withAdditions: true });
      expect(result).toHaveLength(2);
      for (const addition of result) {
        expect(addition.user.id).toBe(editor.id);
        expect(addition.createdAt).toEqual(original.createdAt);
      }
    });

    it('should filter additions by userId', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: editor } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      await ctx.newAlbumUser({ albumId: album.id, userId: editor.id, role: AlbumUserRole.Editor });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset1.id, createdById: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset2.id, createdById: editor.id });

      const result = await sut.getAll(factory.auth({ user: owner }), {
        albumId: album.id,
        userId: editor.id,
        type: ReactionType.ASSET_ADDED,
      });

      expect(result).toEqual([expect.objectContaining({ assetId: asset2.id })]);
    });

    it('should filter additions by assetId when type is asset_added', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset1.id, createdById: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset2.id, createdById: owner.id });

      const result = await sut.getAll(factory.auth({ user: owner }), {
        albumId: album.id,
        assetId: asset1.id,
        type: ReactionType.ASSET_ADDED,
      });

      expect(result).toEqual([expect.objectContaining({ assetId: asset1.id })]);
    });

    it('should share a groupId across a batch and use a new groupId for later additions', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: asset3 } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.get(AlbumRepository).addAssetIds(album.id, [asset1.id, asset2.id], owner.id);
      await ctx.get(AlbumRepository).addAssetIds(album.id, [asset3.id], owner.id);
      // both calls can land in the same millisecond, so force one call's asset to a fudged time
      await setAlbumAssetCreatedAt(ctx.database, {
        albumId: album.id,
        assetId: asset3.id,
        createdAt: new Date('2020-01-05T00:00:00Z'),
      });

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result).toHaveLength(3);
      const groupOf = (assetId: string) => result.find((item) => item.assetId === assetId)?.groupId;
      expect(groupOf(asset1.id)).toBeDefined();
      expect(groupOf(asset1.id)).toEqual(groupOf(asset2.id));
      expect(groupOf(asset3.id)).toBeDefined();
      expect(groupOf(asset3.id)).not.toEqual(groupOf(asset1.id));
    });

    it('should merge additions with comments and likes sorted by createdAt', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: owner.id });
      const { asset: asset2 } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset1.id, createdById: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset2.id, createdById: owner.id });
      await setAlbumAssetCreatedAt(ctx.database, {
        albumId: album.id,
        assetId: asset1.id,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      await setAlbumAssetCreatedAt(ctx.database, {
        albumId: album.id,
        assetId: asset2.id,
        createdAt: new Date('2026-01-03T00:00:00Z'),
      });
      const comment = await ctx.get(ActivityRepository).create({
        albumId: album.id,
        userId: owner.id,
        comment: 'in between',
        isLiked: false,
        createdAt: new Date('2026-01-02T00:00:00Z'),
      });
      const like = await ctx
        .get(ActivityRepository)
        .create({ albumId: album.id, userId: owner.id, isLiked: true, createdAt: new Date('2026-01-04T00:00:00Z') });

      const result = await sut.getAll(factory.auth({ user: owner }), { albumId: album.id, withAdditions: true });

      expect(result.map(({ id }) => id)).toEqual([
        buildAssetAdditionId(album.id, asset1.id),
        comment.id,
        buildAssetAdditionId(album.id, asset2.id),
        like.id,
      ]);
    });

    it('should not return additions of other albums', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album: album1 } = await ctx.newAlbum({ ownerId: owner.id });
      const { album: album2 } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album2.id, assetId: asset.id, createdById: owner.id });

      await expect(
        sut.getAll(factory.auth({ user: owner }), { albumId: album1.id, withAdditions: true }),
      ).resolves.toEqual([]);
    });

    it('should not include asset additions by default', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });

      await expect(sut.getAll(factory.auth({ user: owner }), { albumId: album.id })).resolves.toEqual([]);
    });

    it('should not include additions when filtering by another type', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      const auth = factory.auth({ user: owner });
      const { value: comment } = await sut.create(auth, {
        albumId: album.id,
        type: ReactionType.COMMENT,
        comment: 'comment',
      });

      const result = await sut.getAll(auth, { albumId: album.id, type: ReactionType.COMMENT, withAdditions: true });

      expect(result).toEqual([expect.objectContaining({ id: comment.id, type: ReactionType.COMMENT })]);
    });

    it('should not include additions for asset-level queries', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      const auth = factory.auth({ user: owner });
      const { value: comment } = await sut.create(auth, {
        albumId: album.id,
        assetId: asset.id,
        type: ReactionType.COMMENT,
        comment: 'comment',
      });

      const result = await sut.getAll(auth, { albumId: album.id, assetId: asset.id, withAdditions: true });

      expect(result).toEqual([expect.objectContaining({ id: comment.id, type: ReactionType.COMMENT })]);
    });

    it('should remove the addition when the asset is removed from the album', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      const auth = factory.auth({ user: owner });
      await expect(sut.getAll(auth, { albumId: album.id, withAdditions: true })).resolves.toHaveLength(1);

      await ctx.database
        .deleteFrom('album_asset')
        .where('albumId', '=', album.id)
        .where('assetId', '=', asset.id)
        .execute();

      await expect(sut.getAll(auth, { albumId: album.id, withAdditions: true })).resolves.toEqual([]);
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

  describe('getStatistics', () => {
    it('should not count asset additions', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { album } = await ctx.newAlbum({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await ctx.newAlbumAsset({ albumId: album.id, assetId: asset.id, createdById: owner.id });
      await ctx.get(ActivityRepository).create({ albumId: album.id, userId: owner.id, comment: 'hi', isLiked: false });
      await ctx.get(ActivityRepository).create({ albumId: album.id, userId: owner.id, isLiked: true });

      await expect(sut.getStatistics(factory.auth({ user: owner }), { albumId: album.id })).resolves.toEqual({
        comments: 1,
        likes: 1,
      });
    });
  });
});
