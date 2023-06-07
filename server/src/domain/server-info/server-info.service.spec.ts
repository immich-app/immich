import { newStorageRepositoryMock, newUserRepositoryMock } from '@test';
import { serverVersion } from '../domain.constant';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import { ServerInfoService } from './server-info.service';

describe(ServerInfoService.name, () => {
  let sut: ServerInfoService;
  let storageMock: jest.Mocked<IStorageRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new ServerInfoService(userMock, storageMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getInfo', () => {
    it('should return the disk space as B', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({ free: 200, available: 300, total: 500 });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '300 B',
        diskAvailableRaw: 300,
        diskSize: '500 B',
        diskSizeRaw: 500,
        diskUsagePercentage: 60,
        diskUse: '300 B',
        diskUseRaw: 300,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as KiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({ free: 200_000, available: 300_000, total: 500_000 });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '293.0 KiB',
        diskAvailableRaw: 300000,
        diskSize: '488.3 KiB',
        diskSizeRaw: 500000,
        diskUsagePercentage: 60,
        diskUse: '293.0 KiB',
        diskUseRaw: 300000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as MiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({ free: 200_000_000, available: 300_000_000, total: 500_000_000 });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '286.1 MiB',
        diskAvailableRaw: 300000000,
        diskSize: '476.8 MiB',
        diskSizeRaw: 500000000,
        diskUsagePercentage: 60,
        diskUse: '286.1 MiB',
        diskUseRaw: 300000000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as GiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000,
        available: 300_000_000_000,
        total: 500_000_000_000,
      });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '279.4 GiB',
        diskAvailableRaw: 300000000000,
        diskSize: '465.7 GiB',
        diskSizeRaw: 500000000000,
        diskUsagePercentage: 60,
        diskUse: '279.4 GiB',
        diskUseRaw: 300000000000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as TiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000_000,
        available: 300_000_000_000_000,
        total: 500_000_000_000_000,
      });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '272.8 TiB',
        diskAvailableRaw: 300000000000000,
        diskSize: '454.7 TiB',
        diskSizeRaw: 500000000000000,
        diskUsagePercentage: 60,
        diskUse: '272.8 TiB',
        diskUseRaw: 300000000000000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as PiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000_000_000,
        available: 300_000_000_000_000_000,
        total: 500_000_000_000_000_000,
      });

      await expect(sut.getInfo()).resolves.toEqual({
        diskAvailable: '266.5 PiB',
        diskAvailableRaw: 300000000000000000,
        diskSize: '444.1 PiB',
        diskSizeRaw: 500000000000000000,
        diskUsagePercentage: 60,
        diskUse: '266.5 PiB',
        diskUseRaw: 300000000000000000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });
  });

  describe('ping', () => {
    it('should respond with pong', () => {
      expect(sut.ping()).toEqual({ res: 'pong' });
    });
  });

  describe('getVersion', () => {
    it('should respond the server version', () => {
      expect(sut.getVersion()).toEqual(serverVersion);
    });
  });

  describe('getStats', () => {
    it('should total up usage by user', async () => {
      userMock.getUserStats.mockResolvedValue([
        {
          userId: 'user1',
          userFirstName: '1',
          userLastName: 'User',
          photos: 10,
          videos: 11,
          usage: 12345,
        },
        {
          userId: 'user2',
          userFirstName: '2',
          userLastName: 'User',
          photos: 10,
          videos: 20,
          usage: 123456,
        },
        {
          userId: 'user3',
          userFirstName: '3',
          userLastName: 'User',
          photos: 100,
          videos: 0,
          usage: 987654,
        },
      ]);

      await expect(sut.getStats()).resolves.toEqual({
        photos: 120,
        videos: 31,
        usage: 1123455,
        usageByUser: [
          {
            photos: 10,
            usage: 12345,
            userFirstName: '1',
            userId: 'user1',
            userLastName: 'User',
            videos: 11,
          },
          {
            photos: 10,
            usage: 123456,
            userFirstName: '2',
            userId: 'user2',
            userLastName: 'User',
            videos: 20,
          },
          {
            photos: 100,
            usage: 987654,
            userFirstName: '3',
            userId: 'user3',
            userLastName: 'User',
            videos: 0,
          },
        ],
      });

      expect(userMock.getUserStats).toHaveBeenCalled();
    });
  });
});
