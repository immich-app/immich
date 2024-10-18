import { BadRequestException } from '@nestjs/common';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SearchService } from 'src/services/search.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { personStub } from 'test/fixtures/person.stub';
import { newTestService } from 'test/utils';
import { Mocked, beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;

  let assetMock: Mocked<IAssetRepository>;
  let machineLearningMock: Mocked<IMachineLearningRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let personMock: Mocked<IPersonRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, assetMock, machineLearningMock, partnerMock, personMock, searchMock, systemMock } =
      newTestService(SearchService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('searchPerson', () => {
    it('should pass options to search', async () => {
      const { name } = personStub.withName;

      await sut.searchPerson(authStub.user1, { name, withHidden: false });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.user.id, name, { withHidden: false });

      await sut.searchPerson(authStub.user1, { name, withHidden: true });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.user.id, name, { withHidden: true });
    });
  });

  describe('getExploreData', () => {
    it('should get assets by city and tag', async () => {
      assetMock.getAssetIdByCity.mockResolvedValue({
        fieldName: 'exifInfo.city',
        items: [{ value: 'Paris', data: assetStub.image.id }],
      });
      assetMock.getAssetIdByTag.mockResolvedValue({
        fieldName: 'smartInfo.tags',
        items: [{ value: 'train', data: assetStub.imageFrom2015.id }],
      });
      assetMock.getByIdsWithAllRelations.mockResolvedValue([assetStub.image, assetStub.imageFrom2015]);
      const expectedResponse = [
        { fieldName: 'exifInfo.city', items: [{ value: 'Paris', data: mapAsset(assetStub.image) }] },
        { fieldName: 'smartInfo.tags', items: [{ value: 'train', data: mapAsset(assetStub.imageFrom2015) }] },
      ];

      const result = await sut.getExploreData(authStub.user1);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions (including null)', async () => {
      searchMock.getCountries.mockResolvedValue(['USA', null]);
      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA', null]);
      expect(searchMock.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });

    it('should return search suggestions (without null)', async () => {
      searchMock.getCountries.mockResolvedValue(['USA', null]);
      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA']);
      expect(searchMock.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });
  });

  describe('searchSmart', () => {
    beforeEach(() => {
      searchMock.searchSmart.mockResolvedValue({ hasNextPage: false, items: [] });
      machineLearningMock.encodeText.mockResolvedValue([1, 2, 3]);
    });

    it('should raise a BadRequestException if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: { enabled: false },
      });

      await expect(sut.searchSmart(authStub.user1, { query: 'test' })).rejects.toThrowError(
        new BadRequestException('Smart search is not enabled'),
      );
    });

    it('should raise a BadRequestException if smart search is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: { clip: { enabled: false } },
      });

      await expect(sut.searchSmart(authStub.user1, { query: 'test' })).rejects.toThrowError(
        new BadRequestException('Smart search is not enabled'),
      );
    });

    it('should work', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(machineLearningMock.encodeText).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        expect.objectContaining({ modelName: expect.any(String) }),
      );
      expect(searchMock.searchSmart).toHaveBeenCalledWith(
        { page: 1, size: 100 },
        { query: 'test', embedding: [1, 2, 3], userIds: [authStub.user1.user.id] },
      );
    });

    it('should include partner shared assets', async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1]);

      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(machineLearningMock.encodeText).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        expect.objectContaining({ modelName: expect.any(String) }),
      );
      expect(searchMock.searchSmart).toHaveBeenCalledWith(
        { page: 1, size: 100 },
        { query: 'test', embedding: [1, 2, 3], userIds: [authStub.user1.user.id, authStub.admin.user.id] },
      );
    });

    it('should consider page and size parameters', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test', page: 2, size: 50 });

      expect(machineLearningMock.encodeText).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        expect.objectContaining({ modelName: expect.any(String) }),
      );
      expect(searchMock.searchSmart).toHaveBeenCalledWith(
        { page: 2, size: 50 },
        expect.objectContaining({ query: 'test', embedding: [1, 2, 3], userIds: [authStub.user1.user.id] }),
      );
    });

    it('should use clip model specified in config', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: { clip: { modelName: 'ViT-B-16-SigLIP__webli' } },
      });

      await sut.searchSmart(authStub.user1, { query: 'test' });

      expect(machineLearningMock.encodeText).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        expect.objectContaining({ modelName: 'ViT-B-16-SigLIP__webli' }),
      );
    });

    it('should use language specified in request', async () => {
      await sut.searchSmart(authStub.user1, { query: 'test', language: 'de' });

      expect(machineLearningMock.encodeText).toHaveBeenCalledWith(
        expect.any(String),
        'test',
        expect.objectContaining({ language: 'de' }),
      );
    });
  });
});
