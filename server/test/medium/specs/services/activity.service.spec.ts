import { Kysely } from 'kysely';
import { ReactionType } from 'src/dtos/activity.dto';
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
