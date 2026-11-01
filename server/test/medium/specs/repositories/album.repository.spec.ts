import { Kysely } from 'kysely';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { TagRepository } from 'src/repositories/tag.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database: defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(AlbumRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumRepository.name, () => {
  it('should retain album membership and dates for trusted storage jobs processing private photos', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2010-01-01T00:00:00Z' });
    const { asset: publicPhoto } = await ctx.newAsset({ ownerId: user.id, localDateTime: '2025-01-01T00:00:00Z' });
    const { album } = await ctx.newAlbum({ ownerId: user.id }, [asset.id, publicPhoto.id]);
    const tag = await ctx.get(TagRepository).create({ userId: user.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
    const privateAccess = { includePrivate: true, privateOwnerId: user.id };

    await expect(sut.getByAssetId(user.id, asset.id)).resolves.toEqual([]);
    await expect(sut.getByAssetId(user.id, asset.id, privateAccess)).resolves.toMatchObject([{ id: album.id }]);
    await expect(sut.getMetadataForIds([album.id])).resolves.toMatchObject([
      { assetCount: 1, startDate: new Date('2025-01-01') },
    ]);
    await expect(sut.getMetadataForIds([album.id], privateAccess)).resolves.toMatchObject([
      { assetCount: 2, startDate: new Date('2010-01-01') },
    ]);
  });

  it('should show a public fallback without replacing a private cover', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset: cover } = await ctx.newAsset({ ownerId: user.id });
    const { asset: fallback } = await ctx.newAsset({ ownerId: user.id });
    const { album } = await ctx.newAlbum({ ownerId: user.id, albumThumbnailAssetId: cover.id }, [
      cover.id,
      fallback.id,
    ]);
    const tags = ctx.get(TagRepository);
    const tag = await tags.create({ userId: user.id, value: 'private', isPrivate: true });
    await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [cover.id] });

    await sut.updateThumbnails();

    await expect(sut.getById(album.id)).resolves.toMatchObject({
      albumThumbnailAssetId: cover.id,
      visibleThumbnailAssetId: fallback.id,
    });
    await tags.removeAssetIds(tag.id, [cover.id]);
    await expect(sut.getById(album.id)).resolves.toMatchObject({ visibleThumbnailAssetId: cover.id });
  });

  describe('getUserIds', () => {
    it('should return the owner and shared users of the album', async () => {
      const { ctx, sut } = setup();
      const { album, owner, sharedWith } = await ctx.newSharedAlbum();
      await ctx.newSharedAlbum();

      const userIds = await sut.getUserIds(album.id);

      expect(userIds.toSorted()).toEqual([owner.id, sharedWith.id].toSorted());
    });

    it('should return no users for a deleted album', async () => {
      const { ctx, sut } = setup();
      const { album, owner } = await ctx.newSharedAlbum();
      await sut.softDeleteAll(owner.id);

      const userIds = await sut.getUserIds(album.id);

      expect(userIds).toEqual([]);
    });
  });
});
