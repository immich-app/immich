import { SystemConfigKey } from '@app/infra/entities';
import {
  assetStub,
  authStub,
  newAssetRepositoryMock,
  newMachineLearningRepositoryMock,
  newPersonRepositoryMock,
  newSmartInfoRepositoryMock,
  newSystemConfigRepositoryMock,
  personStub,
} from '@test';
import { mapAsset } from '../asset';
import {
  IAssetRepository,
  IMachineLearningRepository,
  IPersonRepository,
  ISmartInfoRepository,
  ISystemConfigRepository,
} from '../repositories';
import { SearchDto } from './dto';
import { SearchService } from './search.service';

jest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let personMock: jest.Mocked<IPersonRepository>;
  let smartInfoMock: jest.Mocked<ISmartInfoRepository>;

  beforeEach(() => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    personMock = newPersonRepositoryMock();
    smartInfoMock = newSmartInfoRepositoryMock();
    sut = new SearchService(configMock, machineMock, personMock, smartInfoMock, assetMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('searchPerson', () => {
    it('should pass options to search', async () => {
      const { name } = personStub.withName;

      await sut.searchPerson(authStub.user1, { name, withHidden: false });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.id, name, { withHidden: false });

      await sut.searchPerson(authStub.user1, { name, withHidden: true });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.id, name, { withHidden: true });
    });
  });

  describe('getExploreData', () => {
    it('should get assets by city and tag', async () => {
      assetMock.getAssetIdByCity.mockResolvedValueOnce({
        fieldName: 'exifInfo.city',
        items: [{ value: 'Paris', data: assetStub.image.id }],
      });
      assetMock.getAssetIdByTag.mockResolvedValueOnce({
        fieldName: 'smartInfo.tags',
        items: [{ value: 'train', data: assetStub.imageFrom2015.id }],
      });
      assetMock.getByIds.mockResolvedValueOnce([assetStub.image, assetStub.imageFrom2015]);
      const expectedResponse = [
        { fieldName: 'exifInfo.city', items: [{ value: 'Paris', data: mapAsset(assetStub.image) }] },
        { fieldName: 'smartInfo.tags', items: [{ value: 'train', data: mapAsset(assetStub.imageFrom2015) }] },
      ];

      const result = await sut.getExploreData(authStub.user1);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('search', () => {
    it('should throw an error if query is missing', async () => {
      await expect(sut.search(authStub.user1, { q: '' })).rejects.toThrow('Missing query');
    });

    it('should search by metadata if `clip` option is false', async () => {
      const dto: SearchDto = { q: 'test query', clip: false };
      assetMock.searchMetadata.mockResolvedValueOnce([assetStub.image]);
      const expectedResponse = {
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [mapAsset(assetStub.image)],
          facets: [],
        },
      };

      const result = await sut.search(authStub.user1, dto);

      expect(result).toEqual(expectedResponse);
      expect(assetMock.searchMetadata).toHaveBeenCalledWith(dto.q, authStub.user1.id, { numResults: 250 });
      expect(smartInfoMock.searchCLIP).not.toHaveBeenCalled();
    });

    it('should search by CLIP if `clip` option is true', async () => {
      const dto: SearchDto = { q: 'test query', clip: true };
      const embedding = [1, 2, 3];
      smartInfoMock.searchCLIP.mockResolvedValueOnce([assetStub.image]);
      machineMock.encodeText.mockResolvedValueOnce(embedding);
      const expectedResponse = {
        albums: {
          total: 0,
          count: 0,
          items: [],
          facets: [],
        },
        assets: {
          total: 1,
          count: 1,
          items: [mapAsset(assetStub.image)],
          facets: [],
        },
      };

      const result = await sut.search(authStub.user1, dto);

      expect(result).toEqual(expectedResponse);
      expect(smartInfoMock.searchCLIP).toHaveBeenCalledWith({ ownerId: authStub.user1.id, embedding, numResults: 100 });
      expect(assetMock.searchMetadata).not.toHaveBeenCalled();
    });

    it('should throw an error if clip is requested but disabled', async () => {
      const dto: SearchDto = { q: 'test query', clip: true };
      configMock.load
        .mockResolvedValueOnce([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }])
        .mockResolvedValueOnce([{ key: SystemConfigKey.MACHINE_LEARNING_CLIP_ENABLED, value: false }]);

      await expect(sut.search(authStub.user1, dto)).rejects.toThrow('CLIP is not enabled');
      await expect(sut.search(authStub.user1, dto)).rejects.toThrow('CLIP is not enabled');
    });
  });
});
