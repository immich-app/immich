import { Kysely } from 'kysely';
import { AssetMetadataKey } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DuplicateRepository } from 'src/repositories/duplicate.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { DuplicateService } from 'src/services/duplicate.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(DuplicateService, {
    database: db || defaultDatabase,
    real: [AccessRepository, AlbumRepository, AssetRepository, DuplicateRepository, TagRepository, UserRepository],
    mock: [EventRepository, JobRepository, LoggingRepository],
  });
};

const nsfwMetadata = (isNsfw: boolean) => ({
  nsfwDetection: {
    status: 'success',
    result: { isNsfw, score: isNsfw ? 0.95 : 0.05, labels: [] },
  },
});

describe(DuplicateService.name, () => {
  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('nsfw privacy', () => {
    it('filters NSFW duplicate groups using private metadata only', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const mixedDuplicateId = factory.uuid();
      const nsfwOnlyDuplicateId = factory.uuid();
      const tagOnlyDuplicateId = factory.uuid();

      const { asset: mixedSafe1 } = await ctx.newAsset({ ownerId: user.id, duplicateId: mixedDuplicateId });
      const { asset: mixedSafe2 } = await ctx.newAsset({ ownerId: user.id, duplicateId: mixedDuplicateId });
      const { asset: mixedNsfw } = await ctx.newAsset({ ownerId: user.id, duplicateId: mixedDuplicateId });
      const { asset: nsfwOnly1 } = await ctx.newAsset({ ownerId: user.id, duplicateId: nsfwOnlyDuplicateId });
      const { asset: nsfwOnly2 } = await ctx.newAsset({ ownerId: user.id, duplicateId: nsfwOnlyDuplicateId });
      const { asset: tagOnly1 } = await ctx.newAsset({ ownerId: user.id, duplicateId: tagOnlyDuplicateId });
      const { asset: tagOnly2 } = await ctx.newAsset({ ownerId: user.id, duplicateId: tagOnlyDuplicateId });

      for (const asset of [mixedSafe1, mixedSafe2, mixedNsfw, nsfwOnly1, nsfwOnly2, tagOnly1, tagOnly2]) {
        await ctx.newExif({ assetId: asset.id, make: 'Canon' });
      }

      await Promise.all([
        ctx.newMetadata({
          assetId: mixedNsfw.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
        ctx.newMetadata({
          assetId: nsfwOnly1.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
        ctx.newMetadata({
          assetId: nsfwOnly2.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
      ]);

      const [visibleNsfwTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw'] });
      await ctx.newTagAsset({ tagIds: [visibleNsfwTag.id], assetIds: [tagOnly1.id] });

      const hiddenResults = await sut.getDuplicates({ ...auth, hideNsfwAssets: true });
      expect(hiddenResults.map(({ duplicateId }) => duplicateId)).toEqual(
        expect.arrayContaining([mixedDuplicateId, tagOnlyDuplicateId]),
      );
      expect(hiddenResults.map(({ duplicateId }) => duplicateId)).not.toContain(nsfwOnlyDuplicateId);
      expect(
        hiddenResults.find(({ duplicateId }) => duplicateId === mixedDuplicateId)?.assets.map(({ id }) => id),
      ).toEqual(expect.arrayContaining([mixedSafe1.id, mixedSafe2.id]));
      expect(
        hiddenResults.find(({ duplicateId }) => duplicateId === mixedDuplicateId)?.assets.map(({ id }) => id),
      ).not.toContain(mixedNsfw.id);
      expect(
        hiddenResults.find(({ duplicateId }) => duplicateId === tagOnlyDuplicateId)?.assets.map(({ id }) => id),
      ).toEqual(expect.arrayContaining([tagOnly1.id, tagOnly2.id]));

      const elevatedResults = await sut.getDuplicates(auth);
      expect(elevatedResults.map(({ duplicateId }) => duplicateId)).toEqual(
        expect.arrayContaining([mixedDuplicateId, nsfwOnlyDuplicateId, tagOnlyDuplicateId]),
      );
      expect(
        elevatedResults.find(({ duplicateId }) => duplicateId === mixedDuplicateId)?.assets.map(({ id }) => id),
      ).toEqual(expect.arrayContaining([mixedSafe1.id, mixedSafe2.id, mixedNsfw.id]));
    });

    it('denies hidden-mode duplicate mutations for NSFW-only groups', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const duplicateId = factory.uuid();

      const { asset: nsfw1 } = await ctx.newAsset({ ownerId: user.id, duplicateId });
      const { asset: nsfw2 } = await ctx.newAsset({ ownerId: user.id, duplicateId });
      await Promise.all([
        ctx.newExif({ assetId: nsfw1.id, make: 'Canon' }),
        ctx.newExif({ assetId: nsfw2.id, make: 'Canon' }),
        ctx.newMetadata({
          assetId: nsfw1.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
        ctx.newMetadata({
          assetId: nsfw2.id,
          key: AssetMetadataKey.MlEnrichment,
          value: nsfwMetadata(true),
        }),
      ]);

      const hiddenAuth = { ...auth, hideNsfwAssets: true };
      await expect(sut.delete(hiddenAuth, duplicateId)).rejects.toThrow('Not found or no duplicate.delete access');
      await expect(
        sut.resolve(hiddenAuth, { groups: [{ duplicateId, keepAssetIds: [nsfw1.id], trashAssetIds: [nsfw2.id] }] }),
      ).rejects.toThrow('Not found or no duplicate.delete access');

      const remaining = await ctx.database
        .selectFrom('asset')
        .select(['id', 'duplicateId'])
        .where('duplicateId', '=', duplicateId)
        .execute();
      expect(remaining).toHaveLength(2);
      expect(remaining.map(({ id }) => id)).toEqual(expect.arrayContaining([nsfw1.id, nsfw2.id]));
    });
  });
});
