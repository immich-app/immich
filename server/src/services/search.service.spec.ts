import { BadRequestException } from '@nestjs/common';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { AssetVisibility } from 'src/enum';
import { SearchService } from 'src/services/search.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SearchService));
    mocks.partner.getAll.mockResolvedValue([]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('searchPerson', () => {
    it('should pass options to search', async () => {
      const auth = AuthFactory.create();
      const name = 'foo';

      mocks.person.getByName.mockResolvedValue([]);

      await sut.searchPerson(auth, { name, withHidden: false });

      expect(mocks.person.getByName).toHaveBeenCalledWith(auth.user.id, name, { withHidden: false });

      await sut.searchPerson(auth, { name, withHidden: true });

      expect(mocks.person.getByName).toHaveBeenCalledWith(auth.user.id, name, { withHidden: true });
    });
  });

  describe('searchPlaces', () => {
    it('should search places', async () => {
      mocks.search.searchPlaces.mockResolvedValue([
        {
          id: 42,
          name: 'my place',
          latitude: 420,
          longitude: 69,
          admin1Code: null,
          admin1Name: null,
          admin2Code: null,
          admin2Name: null,
          alternateNames: null,
          countryCode: 'US',
          modificationDate: new Date(),
        },
      ]);

      await sut.searchPlaces({ name: 'place' });
      expect(mocks.search.searchPlaces).toHaveBeenCalledWith('place');
    });
  });

  describe('getExploreData', () => {
    it('should get assets by city and tag', async () => {
      const auth = AuthFactory.create();
      const asset = AssetFactory.from()
        .exif({ latitude: 42, longitude: 69, city: 'city', state: 'state', country: 'country' })
        .build();
      mocks.asset.getAssetIdByCity.mockResolvedValue({
        fieldName: 'exifInfo.city',
        items: [{ value: 'city', data: asset.id }],
      });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset as never]);
      const expectedResponse = [{ fieldName: 'exifInfo.city', items: [{ value: 'city', data: mapAsset(asset) }] }];

      const result = await sut.getExploreData(auth);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions for country', async () => {
      mocks.search.getCountries.mockResolvedValue(['USA']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA']);
      expect(mocks.search.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });

    it('should return search suggestions for country (including null)', async () => {
      mocks.search.getCountries.mockResolvedValue(['USA']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA', null]);
      expect(mocks.search.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });

    it('should return search suggestions for state', async () => {
      mocks.search.getStates.mockResolvedValue(['California']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.STATE }),
      ).resolves.toEqual(['California']);
      expect(mocks.search.getStates).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for state (including null)', async () => {
      mocks.search.getStates.mockResolvedValue(['California']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.STATE }),
      ).resolves.toEqual(['California', null]);
      expect(mocks.search.getStates).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for city', async () => {
      mocks.search.getCities.mockResolvedValue(['Denver']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.CITY }),
      ).resolves.toEqual(['Denver']);
      expect(mocks.search.getCities).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for city (including null)', async () => {
      mocks.search.getCities.mockResolvedValue(['Denver']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.CITY }),
      ).resolves.toEqual(['Denver', null]);
      expect(mocks.search.getCities).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera make', async () => {
      mocks.search.getCameraMakes.mockResolvedValue(['Nikon']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.CAMERA_MAKE }),
      ).resolves.toEqual(['Nikon']);
      expect(mocks.search.getCameraMakes).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera make (including null)', async () => {
      mocks.search.getCameraMakes.mockResolvedValue(['Nikon']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.CAMERA_MAKE }),
      ).resolves.toEqual(['Nikon', null]);
      expect(mocks.search.getCameraMakes).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera model', async () => {
      mocks.search.getCameraModels.mockResolvedValue(['Fujifilm X100VI']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.CAMERA_MODEL }),
      ).resolves.toEqual(['Fujifilm X100VI']);
      expect(mocks.search.getCameraModels).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera model (including null)', async () => {
      mocks.search.getCameraModels.mockResolvedValue(['Fujifilm X100VI']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.CAMERA_MODEL }),
      ).resolves.toEqual(['Fujifilm X100VI', null]);
      expect(mocks.search.getCameraModels).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera lens model', async () => {
      mocks.search.getCameraLensModels.mockResolvedValue(['10-24mm']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.CAMERA_LENS_MODEL }),
      ).resolves.toEqual(['10-24mm']);
      expect(mocks.search.getCameraLensModels).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });

    it('should return search suggestions for camera lens model (including null)', async () => {
      mocks.search.getCameraLensModels.mockResolvedValue(['10-24mm']);
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.CAMERA_LENS_MODEL }),
      ).resolves.toEqual(['10-24mm', null]);
      expect(mocks.search.getCameraLensModels).toHaveBeenCalledWith([authStub.user1.user.id], expect.anything());
    });
  });

  describe('searchSmart', () => {
    beforeEach(() => {
      mocks.search.searchSmart.mockResolvedValue({ hasNextPage: false, items: [] });
      mocks.machineLearning.encodeText.mockResolvedValue('[1, 2, 3]');
    });

    it('should raise a BadRequestException if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: { enabled: false },
      });

      await expect(sut.searchSmart(authStub.user1, { query: 'test' })).rejects.toThrowError(
        new BadRequestException('Smart search is not enabled'),
      );
    });

    it('should raise a BadRequestException if smart search is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: { clip: { enabled: false } },
      });

      await expect(sut.searchSmart(authStub.user1, { query: 'test' })).rejects.toThrowError(
        new BadRequestException('Smart search is not enabled'),
      );
    });

    it('should work', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ modelName: expect.any(String) }),
      );
      expect(mocks.search.searchSmart).toHaveBeenCalledWith(
        { page: 1, size: 100 },
        { query: 'test', embedding: '[1, 2, 3]', userIds: [authStub.user1.user.id] },
      );
    });

    it('should consider page and size parameters', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test', page: 2, size: 50 });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ modelName: expect.any(String) }),
      );
      expect(mocks.search.searchSmart).toHaveBeenCalledWith(
        { page: 2, size: 50 },
        expect.objectContaining({ query: 'test', embedding: '[1, 2, 3]', userIds: [authStub.user1.user.id] }),
      );
    });

    it('should use clip model specified in config', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: { clip: { modelName: 'ViT-B-16-SigLIP__webli' } },
      });

      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ modelName: 'ViT-B-16-SigLIP__webli' }),
      );
    });

    it('should use language specified in request', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test', language: 'de' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ language: 'de' }),
      );
    });

    it('should cache embedding for the same query', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test' });
      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
    });

    it('should not use cache for different queries', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test1' });
      await sut.searchSmart(authStub.user1, { query: 'test2' });

      expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(2);
    });

    it('should search by queryAssetId instead of query', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.search.getEmbedding.mockResolvedValue({ embedding: '[4, 5, 6]' });

      await sut.searchSmart(authStub.user1, { queryAssetId: assetId });

      expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
      expect(mocks.search.getEmbedding).toHaveBeenCalledWith(assetId);
      expect(mocks.search.searchSmart).toHaveBeenCalledWith(
        { page: 1, size: 100 },
        expect.objectContaining({ embedding: '[4, 5, 6]', userIds: [authStub.user1.user.id] }),
      );
    });

    it('should throw if queryAssetId has no embedding', async () => {
      const assetId = newUuid();
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.search.getEmbedding.mockResolvedValue(undefined);

      await expect(sut.searchSmart(authStub.user1, { queryAssetId: assetId })).rejects.toThrow(
        `Asset ${assetId} has no embedding`,
      );
    });

    it('should throw if neither query nor queryAssetId is set', async () => {
      await expect(sut.searchSmart(authStub.user1, {})).rejects.toThrow(
        'Either `query` or `queryAssetId` must be set',
      );
    });

    it('should return nextPage when there are more results', async () => {
      mocks.search.searchSmart.mockResolvedValue({ hasNextPage: true, items: [] });

      const result = await sut.searchSmart(authStub.user1, { query: 'test', page: 1 });

      expect(result.assets.nextPage).toEqual('2');
    });

    it('should return null nextPage when there are no more results', async () => {
      mocks.search.searchSmart.mockResolvedValue({ hasNextPage: false, items: [] });

      const result = await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(result.assets.nextPage).toBeNull();
    });
  });

  describe('searchMetadata', () => {
    it('should search metadata with default pagination', async () => {
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

      const result = await sut.searchMetadata(authStub.user1, {});

      expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
        { page: 1, size: 250 },
        expect.objectContaining({ userIds: [authStub.user1.user.id], orderDirection: 'desc' }),
      );
      expect(result.assets.nextPage).toBeNull();
    });

    it('should search metadata with custom pagination', async () => {
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

      await sut.searchMetadata(authStub.user1, { page: 3, size: 50 });

      expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
        { page: 3, size: 50 },
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
    });

    it('should return nextPage when there are more results', async () => {
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: true, items: [] });

      const result = await sut.searchMetadata(authStub.user1, { page: 2 });

      expect(result.assets.nextPage).toEqual('3');
    });

    it('should decode hex checksum', async () => {
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });
      const hexChecksum = 'abcdef1234567890abcdef1234567890abcdef12';

      await sut.searchMetadata(authStub.user1, { checksum: hexChecksum });

      expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ checksum: Buffer.from(hexChecksum, 'hex') }),
      );
    });

    it('should decode base64 checksum (28 characters)', async () => {
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });
      // SHA1 hash in base64 is exactly 28 characters
      const base64Checksum = 'q83vEjRWeJCrze8SNFZ4kKvN7xI=';

      await sut.searchMetadata(authStub.user1, { checksum: base64Checksum });

      expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ checksum: Buffer.from(base64Checksum, 'base64') }),
      );
    });

    it('should throw for locked visibility without elevated permission', async () => {
      const auth = AuthFactory.create();

      await expect(
        sut.searchMetadata(auth, { visibility: AssetVisibility.Locked }),
      ).rejects.toThrow('Elevated permission is required');
    });
  });

  describe('searchStatistics', () => {
    it('should search statistics', async () => {
      mocks.search.searchStatistics.mockResolvedValue({ images: 10, videos: 5, total: 15 } as any);

      const result = await sut.searchStatistics(authStub.user1, {});

      expect(mocks.search.searchStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
      expect(result).toEqual({ images: 10, videos: 5, total: 15 });
    });
  });

  describe('searchRandom', () => {
    it('should search random assets', async () => {
      const asset = AssetFactory.from().build();
      mocks.search.searchRandom.mockResolvedValue([asset as any]);

      const result = await sut.searchRandom(authStub.user1, {});

      expect(mocks.search.searchRandom).toHaveBeenCalledWith(
        250,
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
      expect(result).toHaveLength(1);
    });

    it('should search random assets with custom size', async () => {
      mocks.search.searchRandom.mockResolvedValue([]);

      await sut.searchRandom(authStub.user1, { size: 10 });

      expect(mocks.search.searchRandom).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
    });

    it('should throw for locked visibility without elevated permission', async () => {
      const auth = AuthFactory.create();

      await expect(
        sut.searchRandom(auth, { visibility: AssetVisibility.Locked }),
      ).rejects.toThrow('Elevated permission is required');
    });
  });

  describe('searchLargeAssets', () => {
    it('should search large assets', async () => {
      const asset = AssetFactory.from().build();
      mocks.search.searchLargeAssets.mockResolvedValue([asset as any]);

      const result = await sut.searchLargeAssets(authStub.user1, {});

      expect(mocks.search.searchLargeAssets).toHaveBeenCalledWith(
        250,
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
      expect(result).toHaveLength(1);
    });

    it('should search large assets with custom size', async () => {
      mocks.search.searchLargeAssets.mockResolvedValue([]);

      await sut.searchLargeAssets(authStub.user1, { size: 10 });

      expect(mocks.search.searchLargeAssets).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ userIds: [authStub.user1.user.id] }),
      );
    });

    it('should throw for locked visibility without elevated permission', async () => {
      const auth = AuthFactory.create();

      await expect(
        sut.searchLargeAssets(auth, { visibility: AssetVisibility.Locked }),
      ).rejects.toThrow('Elevated permission is required');
    });
  });

  describe('getAssetsByCity', () => {
    it('should get assets by city', async () => {
      const asset = AssetFactory.from().build();
      mocks.search.getAssetsByCity.mockResolvedValue([asset as any]);

      const result = await sut.getAssetsByCity(authStub.user1);

      expect(mocks.search.getAssetsByCity).toHaveBeenCalledWith([authStub.user1.user.id]);
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserIdsToSearch (via searchMetadata)', () => {
    it('should include partner ids', async () => {
      const partnerId = newUuid();
      mocks.partner.getAll.mockResolvedValue([
        {
          sharedById: partnerId,
          sharedBy: { id: partnerId } as any,
          sharedWithId: authStub.user1.user.id,
          sharedWith: { id: authStub.user1.user.id } as any,
          inTimeline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createId: newUuid(),
          updateId: newUuid(),
        },
      ]);
      mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

      await sut.searchMetadata(authStub.user1, {});

      expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userIds: [authStub.user1.user.id, partnerId] }),
      );
    });
  });
});
