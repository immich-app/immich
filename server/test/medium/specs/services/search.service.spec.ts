import { Kysely } from 'kysely';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AssetMetadataKey, AssetType, ImageEnrichmentFilter } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { SearchService } from 'src/services/search.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(SearchService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AssetRepository,
      DatabaseRepository,
      SearchRepository,
      PartnerRepository,
      PersonRepository,
      TagRepository,
    ],
    mock: [LoggingRepository],
  });
};

const idsForFilter = async (sut: SearchService, userId: string, imageEnrichment: ImageEnrichmentFilter) => {
  const response = await sut.searchMetadata(factory.auth({ user: { id: userId } }), { imageEnrichment });
  return response.assets.items.map(({ id }) => id);
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SearchService.name, () => {
  it('should work', () => {
    const { sut } = setup();
    expect(sut).toBeDefined();
  });

  it('should return assets', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();

    const assets = [];
    const sizes = [12_334, 599, 123_456];

    for (let i = 0; i < sizes.length; i++) {
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, fileSizeInByte: sizes[i] });
      assets.push(asset);
    }

    const auth = factory.auth({ user: { id: user.id } });

    await expect(sut.searchLargeAssets(auth, {})).resolves.toEqual([
      expect.objectContaining({ id: assets[2].id }),
      expect.objectContaining({ id: assets[0].id }),
      expect.objectContaining({ id: assets[1].id }),
    ]);
  });

  describe('searchStatistics', () => {
    it('should return statistics when filtering by personIds', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

      const auth = factory.auth({ user: { id: user.id } });

      const result = await sut.searchStatistics(auth, { personIds: [person.id] });

      expect(result).toEqual({ total: 1 });
    });

    it('should return zero when no assets match the personIds filter', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id });

      const auth = factory.auth({ user: { id: user.id } });

      const result = await sut.searchStatistics(auth, { personIds: [person.id] });

      expect(result).toEqual({ total: 0 });
    });
  });

  describe('withStacked option', () => {
    it('should exclude stacked assets when withStacked is false', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const { asset: primaryAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: stackedAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: unstackedAsset } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newStack({ ownerId: user.id }, [primaryAsset.id, stackedAsset.id]);

      const auth = factory.auth({ user: { id: user.id } });

      const response = await sut.searchMetadata(auth, { withStacked: false });

      expect(response.assets.items.length).toBe(1);
      expect(response.assets.items[0].id).toBe(unstackedAsset.id);
    });
  });

  describe('imageEnrichment option', () => {
    it('should filter NSFW review states and enrichment failures', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();

      const { asset: unreviewedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: acceptedNsfw } = await ctx.newAsset({ ownerId: user.id });
      const { asset: overriddenSafe } = await ctx.newAsset({ ownerId: user.id });
      const { asset: reviewTagged } = await ctx.newAsset({ ownerId: user.id });
      const { asset: descriptionFailed } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfwFailed } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newMetadata({
        assetId: unreviewedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: {
          nsfwDetection: {
            status: 'success',
            result: { isNsfw: true, score: 0.95, labels: { explicit: 0.95 } },
          },
        },
      });
      await ctx.newMetadata({
        assetId: acceptedNsfw.id,
        key: AssetMetadataKey.MlEnrichment,
        value: {
          nsfwDetection: {
            status: 'success',
            result: { isNsfw: true, score: 0.95, labels: { explicit: 0.95 } },
            review: { action: 'accepted', isNsfw: true },
          },
        },
      });
      await ctx.newMetadata({
        assetId: overriddenSafe.id,
        key: AssetMetadataKey.MlEnrichment,
        value: {
          nsfwDetection: {
            status: 'success',
            result: { isNsfw: true, score: 0.95, labels: { explicit: 0.95 } },
            review: { action: 'marked-safe', isNsfw: false },
          },
        },
      });
      await ctx.newMetadata({
        assetId: descriptionFailed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: {
          description: { status: 'failed', error: 'model unavailable' },
        },
      });
      await ctx.newMetadata({
        assetId: nsfwFailed.id,
        key: AssetMetadataKey.MlEnrichment,
        value: {
          nsfwDetection: { status: 'failed', error: 'classifier unavailable' },
        },
      });

      const [reviewTag] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['nsfw_review'] });
      await ctx.newTagAsset({ tagIds: [reviewTag.id], assetIds: [reviewTagged.id] });

      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.Nsfw)).resolves.toEqual(
        expect.arrayContaining([unreviewedNsfw.id, acceptedNsfw.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.Nsfw)).resolves.not.toEqual(
        expect.arrayContaining([overriddenSafe.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.NsfwReview)).resolves.toEqual(
        expect.arrayContaining([unreviewedNsfw.id, reviewTagged.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.NsfwReviewed)).resolves.toEqual(
        expect.arrayContaining([acceptedNsfw.id, overriddenSafe.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.NsfwOverridden)).resolves.toEqual(
        expect.arrayContaining([overriddenSafe.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.NsfwOverridden)).resolves.not.toEqual(
        expect.arrayContaining([acceptedNsfw.id, unreviewedNsfw.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.ImageDescriptionFailed)).resolves.toEqual(
        expect.arrayContaining([descriptionFailed.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.NsfwDetectionFailed)).resolves.toEqual(
        expect.arrayContaining([nsfwFailed.id]),
      );
    });

    it('should filter image assets missing successful enrichment results', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();

      const { asset: missingBoth } = await ctx.newAsset({ ownerId: user.id });
      const { asset: descriptionDone } = await ctx.newAsset({ ownerId: user.id });
      const { asset: nsfwDone } = await ctx.newAsset({ ownerId: user.id });
      const { asset: video } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      await ctx.newMetadata({
        assetId: descriptionDone.id,
        key: AssetMetadataKey.MlEnrichment,
        value: { description: { status: 'success' } },
      });
      await ctx.newMetadata({
        assetId: nsfwDone.id,
        key: AssetMetadataKey.MlEnrichment,
        value: { nsfwDetection: { status: 'success' } },
      });

      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.MissingImageDescription)).resolves.toEqual(
        expect.arrayContaining([missingBoth.id, nsfwDone.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.MissingImageDescription)).resolves.not.toEqual(
        expect.arrayContaining([descriptionDone.id, video.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.MissingNsfwDetection)).resolves.toEqual(
        expect.arrayContaining([missingBoth.id, descriptionDone.id]),
      );
      await expect(idsForFilter(sut, user.id, ImageEnrichmentFilter.MissingNsfwDetection)).resolves.not.toEqual(
        expect.arrayContaining([nsfwDone.id, video.id]),
      );
    });
  });

  describe('getSearchSuggestions', () => {
    it('should filter out empty search suggestions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, make: 'Canon' });

      const { asset: assetWithEmptyMake } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: assetWithEmptyMake.id, make: '' });

      const auth = factory.auth({ user: { id: user.id } });
      const suggestions = await sut.getSearchSuggestions(auth, {
        type: SearchSuggestionType.CAMERA_MAKE,
        includeNull: true,
      });

      expect(suggestions).toEqual(['Canon', null]);
    });
  });
});
