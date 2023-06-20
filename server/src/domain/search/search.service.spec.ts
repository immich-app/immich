import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  albumStub,
  assetEntityStub,
  asyncTick,
  authStub,
  faceStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newFaceRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSearchRepositoryMock,
  searchStub,
} from '@test';
import { plainToInstance } from 'class-transformer';
import { IAlbumRepository } from '../album/album.repository';
import { IAssetRepository } from '../asset/asset.repository';
import { IFaceRepository } from '../facial-recognition';
import { JobName } from '../job';
import { IJobRepository } from '../job/job.repository';
import { IMachineLearningRepository } from '../smart-info';
import { SearchDto } from './dto';
import { ISearchRepository } from './search.repository';
import { SearchService } from './search.service';

jest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let faceMock: jest.Mocked<IFaceRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;
  let configMock: jest.Mocked<ConfigService>;

  const makeSut = (value?: string) => {
    if (value) {
      configMock.get.mockReturnValue(value);
    }
    return new SearchService(albumMock, assetMock, faceMock, jobMock, machineMock, searchMock, configMock);
  };

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    faceMock = newFaceRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    searchMock = newSearchRepositoryMock();
    configMock = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;

    sut = makeSut();
  });

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

  describe('isEnabled', () => {
    it('should be enabled by default', () => {
      expect(sut.isEnabled()).toBe(true);
    });

    it('should be disabled via an env variable', () => {
      const sut = makeSut('false');

      expect(sut.isEnabled()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return the config', () => {
      expect(sut.getConfig()).toEqual({ enabled: true });
    });

    it('should return the config when search is disabled', () => {
      const sut = makeSut('false');

      expect(sut.getConfig()).toEqual({ enabled: false });
    });
  });

  describe(`init`, () => {
    it('should skip when search is disabled', async () => {
      const sut = makeSut('false');

      await sut.init();

      expect(searchMock.setup).not.toHaveBeenCalled();
      expect(searchMock.checkMigrationStatus).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();

      sut.teardown();
    });

    it('should skip schema migration if not needed', async () => {
      searchMock.checkMigrationStatus.mockResolvedValue({ assets: false, albums: false, faces: false });
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

  describe('search', () => {
    it('should throw an error is search is disabled', async () => {
      const sut = makeSut('false');

      await expect(sut.search(authStub.admin, {})).rejects.toBeInstanceOf(BadRequestException);

      expect(searchMock.searchAlbums).not.toHaveBeenCalled();
      expect(searchMock.searchAssets).not.toHaveBeenCalled();
    });

    it('should search assets and albums', async () => {
      searchMock.searchAssets.mockResolvedValue(searchStub.emptyResults);
      searchMock.searchAlbums.mockResolvedValue(searchStub.emptyResults);
      searchMock.vectorSearch.mockResolvedValue(searchStub.emptyResults);

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
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
          distances: [],
        },
      });

      // expect(searchMock.searchAssets).toHaveBeenCalledWith('*', { userId: authStub.admin.id });
      expect(searchMock.searchAlbums).toHaveBeenCalledWith('*', { userId: authStub.admin.id });
    });
  });

  describe('handleIndexAssets', () => {
    it('should call done, even when there are no assets', async () => {
      await sut.handleIndexAssets();

      expect(searchMock.importAssets).toHaveBeenCalledWith([], true);
    });

    it('should index all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleIndexAssets();

      expect(searchMock.importAssets.mock.calls).toEqual([
        [[assetEntityStub.image], false],
        [[], true],
      ]);
    });

    it('should skip if search is disabled', async () => {
      const sut = makeSut('false');

      await sut.handleIndexAssets();

      expect(searchMock.importAssets).not.toHaveBeenCalled();
      expect(searchMock.importAlbums).not.toHaveBeenCalled();
    });
  });

  describe('handleIndexAsset', () => {
    it('should skip if search is disabled', () => {
      const sut = makeSut('false');
      sut.handleIndexAsset({ ids: [assetEntityStub.image.id] });
    });

    it('should index the asset', () => {
      sut.handleIndexAsset({ ids: [assetEntityStub.image.id] });
    });
  });

  describe('handleIndexAlbums', () => {
    it('should skip if search is disabled', () => {
      const sut = makeSut('false');
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
      const sut = makeSut('false');
      sut.handleIndexAlbum({ ids: [albumStub.empty.id] });
    });

    it('should index the album', () => {
      sut.handleIndexAlbum({ ids: [albumStub.empty.id] });
    });
  });

  describe('handleRemoveAlbum', () => {
    it('should skip if search is disabled', () => {
      const sut = makeSut('false');
      sut.handleRemoveAlbum({ ids: ['album1'] });
    });

    it('should remove the album', () => {
      sut.handleRemoveAlbum({ ids: ['album1'] });
    });
  });

  describe('handleRemoveAsset', () => {
    it('should skip if search is disabled', () => {
      const sut = makeSut('false');
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
      const sut = makeSut('false');

      await sut.handleIndexFaces();

      expect(searchMock.importFaces).not.toHaveBeenCalled();
    });
  });

  describe('handleIndexAsset', () => {
    it('should skip if search is disabled', () => {
      const sut = makeSut('false');
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
      const sut = makeSut('false');
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
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);

      sut.handleIndexAsset({ ids: ['asset1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset1']);
      expect(searchMock.importAssets).toHaveBeenCalledWith([assetEntityStub.image], false);
    });

    it('should flush queued asset deletes', async () => {
      sut.handleRemoveAsset({ ids: ['asset1'] });

      jest.runOnlyPendingTimers();

      await asyncTick(4);

      expect(searchMock.deleteAssets).toHaveBeenCalledWith(['asset1']);
    });
  });
});
