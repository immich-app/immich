import { Kysely } from 'kysely';
import { AssetType, AssetVisibility } from 'src/enum';
import { AppMetricsRepository } from 'src/repositories/app-metrics.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const database = db || defaultDatabase;
  const { ctx } = newMediumService(BaseService, {
    database,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: new AppMetricsRepository(database) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AppMetricsRepository.name, () => {
  describe('getMetrics', () => {
    it('returns low-cardinality asset, user, search, state, face, and person metrics', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();

      const { asset: image1 } = await ctx.newAsset({
        ownerId: user1.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: video1 } = await ctx.newAsset({
        ownerId: user1.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: image2 } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Timeline,
        isExternal: true,
      });
      const { asset: hidden } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Hidden,
      });
      const { asset: trashed } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Timeline,
      });
      const { person: person1 } = await ctx.newPerson({ ownerId: user1.id, name: 'Alice' });
      const { person: person2 } = await ctx.newPerson({ ownerId: user1.id, name: 'Bob' });

      await Promise.all([
        ctx.newExif({ assetId: image1.id, fileSizeInByte: 100 }),
        ctx.newExif({ assetId: video1.id, fileSizeInByte: 200 }),
        ctx.newExif({ assetId: image2.id, fileSizeInByte: 300 }),
        ctx.newExif({ assetId: hidden.id, fileSizeInByte: 400 }),
        ctx.newExif({ assetId: trashed.id, fileSizeInByte: 500 }),
        ctx.database.insertInto('smart_search').values({ assetId: image1.id, embedding: newEmbedding() }).execute(),
        ctx.newAssetFace({ assetId: image1.id, personId: person1.id, isVisible: true }),
        ctx.newAssetFace({ assetId: image1.id, personId: person1.id, isVisible: true }),
        ctx.newAssetFace({ assetId: video1.id, personId: person2.id, isVisible: true }),
        ctx.newAssetFace({ assetId: video1.id, personId: person2.id, isVisible: false }),
        ctx.newAssetFace({ assetId: video1.id, personId: null, isVisible: true }),
        ctx.newAssetFace({ assetId: hidden.id, personId: person2.id, isVisible: true }),
        ctx.newAssetFace({ assetId: trashed.id, personId: person2.id, isVisible: true }),
        ctx.softDeleteAsset(trashed.id),
      ]);

      const result = await sut.getMetrics();

      expect(result.asset.assetsByType).toEqual(
        expect.arrayContaining([
          { type: AssetType.Image, count: 2, storageBytes: 400 },
          { type: AssetType.Video, count: 1, storageBytes: 200 },
        ]),
      );
      expect(result.asset.usersByType).toEqual(
        expect.arrayContaining([
          { userId: user1.id, type: AssetType.Image, count: 1, storageBytes: 100 },
          { userId: user1.id, type: AssetType.Video, count: 1, storageBytes: 200 },
          { userId: user2.id, type: AssetType.Image, count: 1, storageBytes: 300 },
        ]),
      );
      expect(result.asset.search).toEqual({ eligibleAssets: 3, embeddedAssets: 1 });
      expect(result.asset.state).toEqual({ externalAssets: 1, trashAssets: 1 });
      expect(result.person).toEqual({ faces: 4, people: 2 });
    });
  });
});
