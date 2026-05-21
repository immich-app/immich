import { Kysely } from 'kysely';
import { forEach } from 'lodash';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
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
  return { ctx, sut: ctx.get(TagRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TagRepository.name, () => {
  afterEach(async () => {
    const { ctx } = setup();
    await ctx.database.deleteFrom('tag_closure').execute();
    await ctx.database.deleteFrom('tag_asset').execute();
    await ctx.database.deleteFrom('tag').execute();
    await ctx.database.deleteFrom('user').execute();
    await ctx.database.deleteFrom('asset').execute();
  });

  describe('getIdsForAssets', () => {
    it('should return an array of tag IDs with the assets that have them', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const [{ asset: asset1 }, { asset: asset2 }, { asset: asset3 }, { asset: asset4 }, { asset: asset5 }] =
        await Promise.all([
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
        ]);

      const [{ tag: tag1 }, { tag: tag2 }, { tag: tag3 }] = await Promise.all([
        ctx.newTag({
          userId: user.id,
          value: 'tag1',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag2',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag3',
          color: '#000000',
        }),
      ]);

      await Promise.all([
        ctx.newTagAsset({
          tagIds: [tag1.id, tag3.id],
          assetIds: [asset1.id, asset2.id, asset5.id],
        }),
        ctx.newTagAsset({
          tagIds: [tag2.id, tag3.id],
          assetIds: [asset3.id, asset4.id],
        }),
      ]);

      const result = await sut.getIdsForAssets([asset1.id, asset2.id, asset3.id, asset4.id, asset5.id]);
      const expectedResponses = [
        { tagId: tag1.id, assetIds: [asset1.id, asset2.id, asset5.id] },
        { tagId: tag2.id, assetIds: [asset3.id, asset4.id] },
        { tagId: tag3.id, assetIds: [asset1.id, asset2.id, asset3.id, asset4.id, asset5.id] },
      ];

      forEach(expectedResponses, (expectedResp) => {
        const tagResult = result.find((r) => r.tagId === expectedResp.tagId);
        expect(tagResult).toBeDefined();
        expect(tagResult?.assetIds).toHaveLength(expectedResp.assetIds.length);
        expect(tagResult?.assetIds).toEqual(expect.arrayContaining(expectedResp.assetIds));
      });
    });
  });

  describe('upsertAssetIds', () => {
    it('should bulk insert asset id/tag id pairs', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const [{ asset: asset1 }, { asset: asset2 }, { asset: asset3 }, { asset: asset4 }, { asset: asset5 }] =
        await Promise.all([
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
        ]);

      const [{ tag: tag1 }, { tag: tag2 }, { tag: tag3 }] = await Promise.all([
        ctx.newTag({
          userId: user.id,
          value: 'tag1',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag2',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag3',
          color: '#000000',
        }),
      ]);

      const testPairs = [
        { assetId: asset1.id, tagId: tag1.id },
        { assetId: asset2.id, tagId: tag1.id },
        { assetId: asset2.id, tagId: tag3.id },
        { assetId: asset3.id, tagId: tag2.id },
        { assetId: asset4.id, tagId: tag2.id },
        { assetId: asset4.id, tagId: tag3.id },
        { assetId: asset5.id, tagId: tag1.id },
      ];
      const result = await sut.upsertAssetIds(testPairs);
      expect(result).toBeDefined();

      await expect(ctx.database.selectFrom('tag_asset').selectAll().orderBy('assetId').execute()).resolves.toEqual(
        testPairs.sort((a, b) => (a.assetId < b.assetId ? -1 : 1)),
      );
    });

    it('should ignore already existing tag id/asset id pairs', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const [{ asset: asset1 }, { asset: asset2 }] = await Promise.all([
        ctx.newAsset({
          ownerId: user.id,
        }),
        ctx.newAsset({
          ownerId: user.id,
        }),
      ]);

      const { tag: tag1 } = await ctx.newTag({
        userId: user.id,
        value: 'tag1',
        color: '#000000',
      });

      await ctx.newTagAsset({
        tagIds: [tag1.id],
        assetIds: [asset1.id],
      });

      const testPairs = [
        { assetId: asset1.id, tagId: tag1.id },
        { assetId: asset2.id, tagId: tag1.id },
      ];
      const result = await sut.upsertAssetIds(testPairs);
      expect(result).toBeDefined();
      await expect(ctx.database.selectFrom('tag_asset').selectAll().orderBy('assetId').execute()).resolves.toEqual(
        testPairs.sort((a, b) => (a.assetId < b.assetId ? -1 : 1)),
      );
    });
  });

  describe('deleteAssetIds', () => {
    it('should bulk delete asset id/tag id pairs', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const [{ asset: asset1 }, { asset: asset2 }, { asset: asset3 }, { asset: asset4 }, { asset: asset5 }] =
        await Promise.all([
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
          ctx.newAsset({
            ownerId: user.id,
          }),
        ]);

      const [{ tag: tag1 }, { tag: tag2 }, { tag: tag3 }] = await Promise.all([
        ctx.newTag({
          userId: user.id,
          value: 'tag1',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag2',
          color: '#000000',
        }),
        ctx.newTag({
          userId: user.id,
          value: 'tag3',
          color: '#000000',
        }),
      ]);

      await Promise.all([
        ctx.newTagAsset({
          tagIds: [tag1.id, tag3.id],
          assetIds: [asset1.id, asset2.id, asset5.id],
        }),
        ctx.newTagAsset({
          tagIds: [tag2.id, tag3.id],
          assetIds: [asset3.id, asset4.id],
        }),
      ]);

      await sut.deleteAssetIds([
        { tagId: tag1.id, assetId: asset1.id },
        { tagId: tag2.id, assetId: asset3.id },
        { tagId: tag3.id, assetId: asset4.id },
      ]);

      const testPairsRemainig = [
        { tagId: tag1.id, assetId: asset2.id },
        { tagId: tag1.id, assetId: asset5.id },
        { tagId: tag2.id, assetId: asset4.id },
        { tagId: tag3.id, assetId: asset1.id },
        { tagId: tag3.id, assetId: asset2.id },
        { tagId: tag3.id, assetId: asset3.id },
        { tagId: tag3.id, assetId: asset5.id },
      ];

      await expect(ctx.database.selectFrom('tag_asset').selectAll().orderBy('assetId').execute()).resolves.toEqual(
        testPairsRemainig.sort((a, b) => (a.assetId < b.assetId ? -1 : 1)),
      );
    });
  });
});
