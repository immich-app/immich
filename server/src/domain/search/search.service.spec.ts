import { BadRequestException } from '@nestjs/common';
import {
  albumStub,
  assetStub,
  asyncTick,
  authStub,
  faceStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSearchRepositoryMock,
  newSystemConfigRepositoryMock,
  searchStub,
} from '@test';
import { plainToInstance } from 'class-transformer';
import { IAlbumRepository } from '../album/album.repository';
import { mapAsset } from '../asset';
import { IAssetRepository } from '../asset/asset.repository';
import { IFaceRepository } from '../facial-recognition';
import { JobName } from '../job';
import { IJobRepository } from '../job/job.repository';
import { IMachineLearningRepository } from '../smart-info';
import { ISystemConfigRepository } from '../system-config';
import { SearchDto } from './dto';
import { ISearchRepository } from './search.repository';
import { SearchService } from './search.service';

jest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let faceMock: jest.Mocked<IFaceRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    faceMock = newFaceRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    searchMock = newSearchRepositoryMock();

    sut = new SearchService(albumMock, assetMock, configMock, faceMock, jobMock, machineMock, searchMock);

    searchMock.checkMigrationStatus.mockResolvedValue({ assets: false, albums: false, faces: false });

    delete process.env.TYPESENSE_ENABLED;
    await sut.init();
  });

  const disableSearch = () => {
    searchMock.setup.mockClear();
    searchMock.checkMigrationStatus.mockClear();
    jobMock.queue.mockClear();
    process.env.TYPESENSE_ENABLED = 'false';
  };

  afterEach(() => {
    sut.teardown();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('request dto', () => {
    it('should convert smartInfo.tags to a string list', () => {
      const instance = plainToInstance(SearchDto, { 'smartInfo.tags': 'a,b,c' });
      expect(instance['smartInfo.tags']).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty smartInfo.tags', () => {
      const instance = plainToInstance(SearchDto, {});
      expect(instance['smartInfo.tags']).toBeUndefined();
    });

    it('should convert smartInfo.objects to a string list', () => {
      const instance = plainToInstance(SearchDto, { 'smartInfo.objects': 'a,b,c' });
      expect(instance['smartInfo.objects']).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty smartInfo.objects', () => {
      const instance = plainToInstance(SearchDto, {});
      expect(instance['smartInfo.objects']).toBeUndefined();
    });
  });

  describe(`init`, () => {
    it('should skip when search is disabled', async () => {
      disableSearch();
      await sut.init();

      expect(searchMock.setup).not.toHaveBeenCalled();
      expect(searchMock.checkMigrationStatus).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should skip schema migration if not needed', async () => {
      await sut.init();

      expect(searchMock.setup).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should do schema migration if needed', async () => {
      searchMock.checkMigrationStatus.mockResolvedValue({ assets: true, albums: true, faces: true });
      await sut.init();

      expect(searchMock.setup).toHaveBeenCalled();
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.SEARCH_INDEX_ASSETS }],
        [{ name: JobName.SEARCH_INDEX_ALBUMS }],
        [{ name: JobName.SEARCH_INDEX_FACES }],
      ]);
    });
  });

  describe('getExploreData', () => {
    it('should throw bad request exception if search is disabled', async () => {
      disableSearch();
      await expect(sut.getExploreData(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(searchMock.explore).not.toHaveBeenCalled();
    });

    it('should return explore data if feature flag SEARCH is set', async () => {
      searchMock.explore.mockResolvedValue([{ fieldName: 'name', items: [{ value: 'image', data: assetStub.image }] }]);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await expect(sut.getExploreData(authStub.admin)).resolves.toEqual([
        {
          fieldName: 'name',
          items: [{ value: 'image', data: mapAsset(assetStub.image) }],
        },
      ]);

      expect(searchMock.explore).toHaveBeenCalledWith(authStub.admin.id);
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id]);
    });
  });

  describe('search', () => {
    // it('should throw an error is search is disabled', async () => {
    //   sut['enabled'] = false;

    //   await expect(sut.search(authStub.admin, {})).rejects.toBeInstanceOf(BadRequestException);

    //   expect(searchMock.searchAlbums).not.toHaveBeenCalled();
    //   expect(searchMock.searchAssets).not.toHaveBeenCalled();
    // });

    it('should search assets and albums using text search', async () => {
      searchMock.searchAssets.mockResolvedValue(searchStub.withImage);
      searchMock.searchAlbums.mockResolvedValue(searchStub.emptyResults);
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await expect(sut.search(authStub.admin, {})).resolves.toEqual({
        albums: {
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
          distances: [],
        },
        assets: {
          total: 1,
          count: 1,
          page: 1,
          items: [mapAsset(assetStub.image)],
          facets: [],
          distances: [],
        },
      });

      // expect(searchMock.searchAssets).toHaveBeenCalledWith('*', { userId: authStub.admin.id });
      expect(searchMock.searchAlbums).toHaveBeenCalledWith('*', { userId: authStub.admin.id });
    });

    it('should search assets and albums using vector search', async () => {
      searchMock.vectorSearch.mockResolvedValue(searchStub.emptyResults);
      searchMock.searchAlbums.mockResolvedValue(searchStub.emptyResults);
      machineMock.encodeText.mockResolvedValue([123]);

      await expect(sut.search(authStub.admin, { clip: true, query: 'foo' })).resolves.toEqual({
        albums: {
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
          distances: [],
        },
        assets: {
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
          distances: [],
        },
      });

      expect(machineMock.encodeText).toHaveBeenCalledWith(expect.any(String), { text: 'foo' }, expect.any(Object));
      expect(searchMock.vectorSearch).toHaveBeenCalledWith([123], {
        userId: authStub.admin.id,
        clip: true,
        query: 'foo',
      });
      expect(searchMock.searchAlbums).toHaveBeenCalledWith('foo', {
        userId: authStub.admin.id,
        clip: true,
        query: 'foo',
      });
    });
  });

  describe('handleIndexAssets', () => {
    it('should call done, even when there are no assets', async () => {
      await sut.handleIndexAssets();

      expect(searchMock.importAssets).toHaveBeenCalledWith([], true);
    });

    it('should index all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleIndexAssets();

      expect(searchMock.importAssets.mock.calls).toEqual([
        [[assetStub.image], false],
        [[], true],
      ]);
    });

    it('should skip if search is disabled', async () => {
      sut['enabled'] = false;

      await sut.handleIndexAssets();

      expect(searchMock.importAssets).not.toHaveBeenCalled();
      expect(searchMock.importAlbums).not.toHaveBeenCalled();
    });
  });

  describe('handleIndexAsset', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleIndexAsset({ ids: [assetStub.image.id] });
    });

    it('should index the asset', () => {
      sut.handleIndexAsset({ ids: [assetStub.image.id] });
    });
  });

  describe('handleIndexAlbums', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleIndexAlbums();
    });

    it('should index all the albums', async () => {
      albumMock.getAll.mockResolvedValue([albumStub.empty]);

      await sut.handleIndexAlbums();

      expect(searchMock.importAlbums).toHaveBeenCalledWith([albumStub.empty], true);
    });
  });

  describe('handleIndexAlbum', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleIndexAlbum({ ids: [albumStub.empty.id] });
    });

    it('should index the album', () => {
      sut.handleIndexAlbum({ ids: [albumStub.empty.id] });
    });
  });

  describe('handleRemoveAlbum', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleRemoveAlbum({ ids: ['album1'] });
    });

    it('should remove the album', () => {
      sut.handleRemoveAlbum({ ids: ['album1'] });
    });
  });

  describe('handleRemoveAsset', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleRemoveAsset({ ids: ['asset1'] });
    });

    it('should remove the asset', () => {
      sut.handleRemoveAsset({ ids: ['asset1'] });
    });
  });

  describe('handleIndexFaces', () => {
    it('should call done, even when there are no faces', async () => {
      faceMock.getAll.mockResolvedValue([]);

      await sut.handleIndexFaces();

      expect(searchMock.importFaces).toHaveBeenCalledWith([], true);
    });

    it('should index all the faces', async () => {
      faceMock.getAll.mockResolvedValue([faceStub.face1]);

      await sut.handleIndexFaces();

      expect(searchMock.importFaces.mock.calls).toEqual([
        [
          [
            {
              id: 'asset-id|person-1',
              ownerId: 'user-id',
              assetId: 'asset-id',
              personId: 'person-1',
              embedding: [1, 2, 3, 4],
            },
          ],
          false,
        ],
        [[], true],
      ]);
    });

    it('should skip if search is disabled', async () => {
      sut['enabled'] = false;

      await sut.handleIndexFaces();

      expect(searchMock.importFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleIndexAsset', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleIndexFace({ assetId: 'asset-1', personId: 'person-1' });

      expect(searchMock.importFaces).not.toHaveBeenCalled();
      expect(faceMock.getByIds).not.toHaveBeenCalled();
    });

    it('should index the face', () => {
      faceMock.getByIds.mockResolvedValue([faceStub.face1]);

      sut.handleIndexFace({ assetId: 'asset-1', personId: 'person-1' });

      expect(faceMock.getByIds).toHaveBeenCalledWith([{ assetId: 'asset-1', personId: 'person-1' }]);
    });
  });

  describe('handleRemoveFace', () => {
    it('should skip if search is disabled', () => {
      sut['enabled'] = false;
      sut.handleRemoveFace({ assetId: 'asset-1', personId: 'person-1' });
    });

    it('should remove the face', () => {
      sut.handleRemoveFace({ assetId: 'asset-1', personId: 'person-1' });
    });
  });

  describe('flush', () => {
    it('should flush queued album updates', async () => {
      albumMock.getByIds.mockResolvedValue([albumStub.empty]);

      sut.handleIndexAlbum({ ids: ['album1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(albumMock.getByIds).toHaveBeenCalledWith(['album1']);
      expect(searchMock.importAlbums).toHaveBeenCalledWith([albumStub.empty], false);
    });

    it('should flush queued album deletes', async () => {
      sut.handleRemoveAlbum({ ids: ['album1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(searchMock.deleteAlbums).toHaveBeenCalledWith(['album1']);
    });

    it('should flush queued asset updates', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      sut.handleIndexAsset({ ids: ['asset1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset1']);
      expect(searchMock.importAssets).toHaveBeenCalledWith([assetStub.image], false);
    });

    it('should flush queued asset deletes', async () => {
      sut.handleRemoveAsset({ ids: ['asset1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(searchMock.deleteAssets).toHaveBeenCalledWith(['asset1']);
    });
  });
});
