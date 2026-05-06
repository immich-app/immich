import { Kysely } from 'kysely';
import { AssetMetadataKey } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { AlbumService } from 'src/services/album.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AlbumService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AlbumRepository, AssetRepository, MapRepository, TagRepository],
    mock: [LoggingRepository],
  });
};

const nsfwMetadata = (isNsfw: boolean, review?: { action: string; isNsfw: boolean }) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: { explicit: isNsfw ? 0.95 : 0.05 } },
    ...(review ? { review } : {}),
  },
});

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumService.name, () => {
  describe('getAll', () => {
    it('should not reveal album membership for hidden NSFW asset lookups', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const albumRepository = ctx.get(AlbumRepository);
      const { user } = await ctx.newUser();

      const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });

      const { album: unreviewedAlbum } = await ctx.newAlbum({ ownerId: user.id }, [unreviewedNsfw.id]);
      const { album: markedSafeAlbum } = await ctx.newAlbum({ ownerId: user.id }, [markedSafe.id]);
      const { album: markedNsfwAlbum } = await ctx.newAlbum({ ownerId: user.id }, [markedNsfw.id]);
      const { album: tagOnlyAlbum } = await ctx.newAlbum({ ownerId: user.id }, [tagOnly.id]);

      await ctx.newMetadata({
        assetId: unreviewedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true),
      });
      await ctx.newMetadata({
        assetId: markedSafe.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
      });
      await ctx.newMetadata({
        assetId: markedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
      });

      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

      const hiddenAuth = { ...factory.auth({ user: { id: user.id } }), hideNsfwAssets: true };
      await expect(sut.getAll(hiddenAuth, { assetId: unreviewedNsfw.id })).resolves.toEqual([]);
      await expect(sut.getAll(hiddenAuth, { assetId: markedNsfw.id })).resolves.toEqual([]);
      await expect(sut.getAll(hiddenAuth, { assetId: markedSafe.id })).resolves.toEqual([
        expect.objectContaining({ id: markedSafeAlbum.id, assetCount: 1 }),
      ]);
      await expect(sut.getAll(hiddenAuth, { assetId: tagOnly.id })).resolves.toEqual([
        expect.objectContaining({ id: tagOnlyAlbum.id, assetCount: 1 }),
      ]);

      await expect(
        sut.getAll(factory.auth({ user: { id: user.id } }), { assetId: unreviewedNsfw.id }),
      ).resolves.toEqual([expect.objectContaining({ id: unreviewedAlbum.id, assetCount: 1 })]);

      await expect(albumRepository.getAssetIds(markedNsfwAlbum.id, [markedNsfw.id])).resolves.toEqual(
        new Set([markedNsfw.id]),
      );
    });
  });

  describe('getMapMarkers', () => {
    it('filters album map markers using private NSFW metadata only', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();

      const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
      const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedSafe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: markedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: tagOnly } = await ctx.newAsset({ ownerId: user.id });
      const { album } = await ctx.newAlbum({ ownerId: user.id }, [
        visible.id,
        unreviewedNsfw.id,
        markedSafe.id,
        markedNsfw.id,
        tagOnly.id,
      ]);

      for (const [index, asset] of [visible, unreviewedNsfw, markedSafe, markedNsfw, tagOnly].entries()) {
        await ctx.newExif({
          assetId: asset.id,
          latitude: 42 + index / 100,
          longitude: 69 + index / 100,
          city: `city-${index}`,
          state: 'state',
          country: 'country',
        });
      }

      await Promise.all([
        ctx.newMetadata({
          assetId: unreviewedNsfw.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
        ctx.newMetadata({
          assetId: markedSafe.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true, { action: 'marked-safe', isNsfw: false }),
        }),
        ctx.newMetadata({
          assetId: markedNsfw.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(false, { action: 'marked-nsfw', isNsfw: true }),
        }),
      ]);

      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly.id] });

      const hiddenAuth = { ...factory.auth({ user: { id: user.id } }), hideNsfwAssets: true };
      const hiddenMarkers = await sut.getMapMarkers(hiddenAuth, album.id);
      expect(hiddenMarkers.map(({ id }) => id)).toEqual(
        expect.arrayContaining([visible.id, markedSafe.id, tagOnly.id]),
      );
      expect(hiddenMarkers.map(({ id }) => id)).not.toEqual(expect.arrayContaining([unreviewedNsfw.id, markedNsfw.id]));

      const elevatedMarkers = await sut.getMapMarkers(factory.auth({ user: { id: user.id } }), album.id);
      expect(elevatedMarkers.map(({ id }) => id)).toEqual(
        expect.arrayContaining([visible.id, unreviewedNsfw.id, markedSafe.id, markedNsfw.id, tagOnly.id]),
      );
    });
  });
});
