import { AssetType } from '@app/database/entities';
import { IAssetRepository, ServerInfoService } from './server-info.service';

jest.mock('diskusage', () => {
  return {
    check: jest.fn().mockImplementation(() => {
      console.log('mocked');
      return { total: 100, free: 80, available: 20 };
    }),
  };
});

describe('ServerInfoService', () => {
  let sut: ServerInfoService;
  let repositoryMock: jest.Mocked<IAssetRepository>;

  beforeEach(async () => {
    repositoryMock = {
      getUserStats: jest.fn(),
    };

    sut = new ServerInfoService(repositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getServerDiskInfo', () => {
    it('should return the current disk info', async () => {
      await expect(sut.getServerDiskInfo()).resolves.toEqual({
        diskAvailable: '20 B',
        diskAvailableRaw: 20,
        diskSize: '100 B',
        diskSizeRaw: 100,
        diskUsagePercentage: 20,
        diskUse: '20 B',
        diskUseRaw: 20,
      });
    });

    it('should calculate the usage statistics', async () => {
      repositoryMock.getUserStats.mockResolvedValue([
        {
          assetType: AssetType.IMAGE,
          userId: 'user-1',
          assetCount: 1234,
          totalSizeInBytes: 123456,
        },
        {
          assetType: AssetType.VIDEO,
          userId: 'user-2',
          assetCount: 100,
          totalSizeInBytes: 23456,
        },
        {
          assetType: AssetType.OTHER,
          userId: 'user-1',
          assetCount: 0,
          totalSizeInBytes: 0,
        },
        {
          assetType: AssetType.AUDIO,
          userId: 'user-1',
          assetCount: 0,
          totalSizeInBytes: 0,
        },
      ]);

      await expect(sut.getServerUsageInfo()).resolves.toEqual({
        audio: 0,
        photos: 1234,
        videos: 100,
        other: 0,
        objects: 0,
        usageRaw: 146912,
        usage: '',
        usageByUser: [
          {
            userId: 'user-1',
            videos: 0,
            photos: 1234,
            audio: 0,
            other: 0,
            usageRaw: 123456,
            usage: '120.6 KiB',
          },
          {
            userId: 'user-2',
            videos: 100,
            photos: 0,
            audio: 0,
            other: 0,
            usageRaw: 23456,
            usage: '22.9 KiB',
          },
        ],
      });

      expect(repositoryMock.getUserStats).toHaveBeenCalledTimes(1);
    });
  });
});
