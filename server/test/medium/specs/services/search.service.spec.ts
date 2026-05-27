import { Kysely } from 'kysely';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { DB } from 'src/schema';
import { SearchService } from 'src/services/search.service';
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
    ],
    mock: [LoggingRepository],
  });
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

  describe('aspect ratio filter', () => {
    it('should filter by minAspectRatio', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const { asset: wideAsset } = await ctx.newAsset({ ownerId: user.id, width: 4000, height: 1000 });
      await ctx.newAsset({ ownerId: user.id, width: 3000, height: 3000 });
      await ctx.newAsset({ ownerId: user.id, width: 1000, height: 4000 });

      const auth = factory.auth({ user: { id: user.id } });
      const response = await sut.searchMetadata(auth, { minAspectRatio: 2 });

      expect(response.assets.items).toEqual([expect.objectContaining({ id: wideAsset.id })]);
    });

    it('should filter by maxAspectRatio', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await ctx.newAsset({ ownerId: user.id, width: 4000, height: 3000 });
      const { asset: narrowAsset } = await ctx.newAsset({ ownerId: user.id, width: 1000, height: 4000 });
      await ctx.newAsset({ ownerId: user.id, width: 3000, height: 3000 });

      const auth = factory.auth({ user: { id: user.id } });
      const response = await sut.searchMetadata(auth, { maxAspectRatio: 0.5 });

      expect(response.assets.items).toEqual([expect.objectContaining({ id: narrowAsset.id })]);
    });

    it('should filter by both minAspectRatio and maxAspectRatio', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      // ratio 4:3 = 1.333 — within [1.2, 1.5]
      const { asset: inRangeAsset } = await ctx.newAsset({ ownerId: user.id, width: 4000, height: 3000 });
      // ratio 4:1 = 4.0 — above max
      await ctx.newAsset({ ownerId: user.id, width: 4000, height: 1000 });
      // ratio 1:4 = 0.25 — below min
      await ctx.newAsset({ ownerId: user.id, width: 1000, height: 4000 });

      const auth = factory.auth({ user: { id: user.id } });
      const response = await sut.searchMetadata(auth, { minAspectRatio: 1.2, maxAspectRatio: 1.5 });

      expect(response.assets.items).toEqual([expect.objectContaining({ id: inRangeAsset.id })]);
    });
  });

  describe('resolution filter', () => {
    it('should filter by minimum width and height', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const { asset: highResAsset } = await ctx.newAsset({ ownerId: user.id, width: 4000, height: 3000 });
      await ctx.newAsset({ ownerId: user.id, width: 3000, height: 3000 });
      await ctx.newAsset({ ownerId: user.id, width: 4000, height: 2000 });

      const auth = factory.auth({ user: { id: user.id } });
      const response = await sut.searchMetadata(auth, { minWidth: 3500, minHeight: 2500 });

      expect(response.assets.items).toEqual([expect.objectContaining({ id: highResAsset.id })]);
    });

    it('should filter by maximum width and height', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await ctx.newAsset({ ownerId: user.id, width: 2000, height: 1500 });
      const { asset: lowResAsset } = await ctx.newAsset({ ownerId: user.id, width: 1000, height: 800 });
      await ctx.newAsset({ ownerId: user.id, width: 1200, height: 1600 });

      const auth = factory.auth({ user: { id: user.id } });
      const response = await sut.searchMetadata(auth, { maxWidth: 1200, maxHeight: 1000 });

      expect(response.assets.items).toEqual([expect.objectContaining({ id: lowResAsset.id })]);
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
