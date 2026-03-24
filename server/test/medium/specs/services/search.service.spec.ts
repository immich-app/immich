import { Kysely } from 'kysely';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
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
      SharedSpaceRepository,
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

  describe('library-linked space assets', () => {
    it('should include library-linked assets in searchMetadata when filtering by spaceId', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      // Create a library and an asset belonging to that library
      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { asset: libraryAsset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });

      // Create a space, add member, link the library
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });

      const auth = factory.auth({ user: { id: member.id } });

      const result = await sut.searchMetadata(auth, { spaceId: space.id });

      expect(result.assets.items).toEqual([expect.objectContaining({ id: libraryAsset.id })]);
    });

    it('should include library-linked assets in searchLargeAssets when filtering by spaceId', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { asset: libraryAsset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
      await ctx.newExif({ assetId: libraryAsset.id, fileSizeInByte: 999_999 });

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });

      const auth = factory.auth({ user: { id: member.id } });

      const result = await sut.searchLargeAssets(auth, { spaceId: space.id });

      expect(result).toEqual([expect.objectContaining({ id: libraryAsset.id })]);
    });

    it('should include library-linked assets in getSearchSuggestions for countries', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { asset: libraryAsset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
      await ctx.newExif({ assetId: libraryAsset.id, country: 'Germany' });

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });

      const auth = factory.auth({ user: { id: member.id } });

      const result = await sut.getSearchSuggestions(auth, {
        type: SearchSuggestionType.COUNTRY,
        spaceId: space.id,
        includeNull: false,
      });

      expect(result).toContain('Germany');
    });

    it('should include library-linked assets in getSearchSuggestions for cities', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { asset: libraryAsset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
      await ctx.newExif({ assetId: libraryAsset.id, city: 'Berlin', country: 'Germany' });

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });

      const auth = factory.auth({ user: { id: member.id } });

      const result = await sut.getSearchSuggestions(auth, {
        type: SearchSuggestionType.CITY,
        spaceId: space.id,
        includeNull: false,
      });

      expect(result).toContain('Berlin');
    });

    it('should include library-linked assets in getSearchSuggestions for camera makes', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();

      const { library } = await ctx.newLibrary({ ownerId: owner.id });
      const { asset: libraryAsset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
      await ctx.newExif({ assetId: libraryAsset.id, make: 'Sony' });

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });

      const auth = factory.auth({ user: { id: member.id } });

      const result = await sut.getSearchSuggestions(auth, {
        type: SearchSuggestionType.CAMERA_MAKE,
        spaceId: space.id,
        includeNull: false,
      });

      expect(result).toContain('Sony');
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
