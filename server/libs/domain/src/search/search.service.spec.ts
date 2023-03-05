import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  albumStub,
  assetEntityStub,
  authStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newMachineLearningRepositoryMock,
  newSearchRepositoryMock,
} from '../../test';
import { IAlbumRepository } from '../album/album.repository';
import { IAssetRepository } from '../asset/asset.repository';
import { JobName } from '../job';
import { IJobRepository } from '../job/job.repository';
import { IMachineLearningRepository } from '../smart-info';
import { SearchDto } from './dto';
import { ISearchRepository } from './search.repository';
import { SearchService } from './search.service';

describe(SearchService.name, () => {
  let sut: SearchService;
  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let machineMock: jest.Mocked<IMachineLearningRepository>;
  let searchMock: jest.Mocked<ISearchRepository>;
  let configMock: jest.Mocked<ConfigService>;

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    searchMock = newSearchRepositoryMock();
    configMock = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;

    sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);
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
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      expect(sut.isEnabled()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return the config', () => {
      expect(sut.getConfig()).toEqual({ enabled: true });
    });

    it('should return the config when search is disabled', () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      expect(sut.getConfig()).toEqual({ enabled: false });
    });
  });

  describe(`bootstrap`, () => {
    it('should skip when search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.bootstrap();

      expect(searchMock.setup).not.toHaveBeenCalled();
      expect(searchMock.checkMigrationStatus).not.toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should skip schema migration if not needed', async () => {
      searchMock.checkMigrationStatus.mockResolvedValue({ assets: false, albums: false });
      await sut.bootstrap();

      expect(searchMock.setup).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should do schema migration if needed', async () => {
      searchMock.checkMigrationStatus.mockResolvedValue({ assets: true, albums: true });
      await sut.bootstrap();

      expect(searchMock.setup).toHaveBeenCalled();
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.SEARCH_INDEX_ASSETS }],
        [{ name: JobName.SEARCH_INDEX_ALBUMS }],
      ]);
    });
  });

  describe('search', () => {
    it('should throw an error is search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await expect(sut.search(authStub.admin, {})).rejects.toBeInstanceOf(BadRequestException);

      expect(searchMock.search).not.toHaveBeenCalled();
    });

    it('should search assets and albums', async () => {
      searchMock.search.mockResolvedValue({
        total: 0,
        count: 0,
        page: 1,
        items: [],
        facets: [],
      });

      await expect(sut.search(authStub.admin, {})).resolves.toEqual({
        albums: {
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
        },
        assets: {
          total: 0,
          count: 0,
          page: 1,
          items: [],
          facets: [],
        },
      });

      expect(searchMock.search.mock.calls).toEqual([
        ['assets', '*', { userId: authStub.admin.id }],
        ['albums', '*', { userId: authStub.admin.id }],
      ]);
    });
  });

  describe('handleIndexAssets', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleIndexAssets();

      expect(searchMock.import).not.toHaveBeenCalled();
    });

    it('should index all the assets', async () => {
      assetMock.getAll.mockResolvedValue([]);

      await sut.handleIndexAssets();

      expect(searchMock.import).toHaveBeenCalledWith('assets', [], true);
    });

    it('should log an error', async () => {
      assetMock.getAll.mockResolvedValue([]);
      searchMock.import.mockRejectedValue(new Error('import failed'));

      await sut.handleIndexAssets();
    });
  });

  describe('handleIndexAsset', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleIndexAsset({ asset: assetEntityStub.image });

      expect(searchMock.index).not.toHaveBeenCalled();
    });

    it('should index the asset', async () => {
      await sut.handleIndexAsset({ asset: assetEntityStub.image });

      expect(searchMock.index).toHaveBeenCalledWith('assets', assetEntityStub.image);
    });

    it('should log an error', async () => {
      searchMock.index.mockRejectedValue(new Error('index failed'));

      await sut.handleIndexAsset({ asset: assetEntityStub.image });

      expect(searchMock.index).toHaveBeenCalled();
    });
  });

  describe('handleIndexAlbums', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleIndexAlbums();

      expect(searchMock.import).not.toHaveBeenCalled();
    });

    it('should index all the albums', async () => {
      albumMock.getAll.mockResolvedValue([]);

      await sut.handleIndexAlbums();

      expect(searchMock.import).toHaveBeenCalledWith('albums', [], true);
    });

    it('should log an error', async () => {
      albumMock.getAll.mockResolvedValue([]);
      searchMock.import.mockRejectedValue(new Error('import failed'));

      await sut.handleIndexAlbums();
    });
  });

  describe('handleIndexAlbum', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleIndexAlbum({ album: albumStub.empty });

      expect(searchMock.index).not.toHaveBeenCalled();
    });

    it('should index the album', async () => {
      await sut.handleIndexAlbum({ album: albumStub.empty });

      expect(searchMock.index).toHaveBeenCalledWith('albums', albumStub.empty);
    });

    it('should log an error', async () => {
      searchMock.index.mockRejectedValue(new Error('index failed'));

      await sut.handleIndexAlbum({ album: albumStub.empty });

      expect(searchMock.index).toHaveBeenCalled();
    });
  });

  describe('handleRemoveAlbum', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleRemoveAlbum({ id: 'album1' });

      expect(searchMock.delete).not.toHaveBeenCalled();
    });

    it('should remove the album', async () => {
      await sut.handleRemoveAlbum({ id: 'album1' });

      expect(searchMock.delete).toHaveBeenCalledWith('albums', 'album1');
    });

    it('should log an error', async () => {
      searchMock.delete.mockRejectedValue(new Error('remove failed'));

      await sut.handleRemoveAlbum({ id: 'album1' });

      expect(searchMock.delete).toHaveBeenCalled();
    });
  });

  describe('handleRemoveAsset', () => {
    it('should skip if search is disabled', async () => {
      configMock.get.mockReturnValue('false');
      sut = new SearchService(albumMock, assetMock, jobMock, machineMock, searchMock, configMock);

      await sut.handleRemoveAsset({ id: 'asset1`' });

      expect(searchMock.delete).not.toHaveBeenCalled();
    });

    it('should remove the asset', async () => {
      await sut.handleRemoveAsset({ id: 'asset1' });

      expect(searchMock.delete).toHaveBeenCalledWith('assets', 'asset1');
    });

    it('should log an error', async () => {
      searchMock.delete.mockRejectedValue(new Error('remove failed'));

      await sut.handleRemoveAsset({ id: 'asset1' });

      expect(searchMock.delete).toHaveBeenCalled();
    });
  });
});
