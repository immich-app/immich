import { SystemMetadataKey } from 'src/enum';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { ServerService } from 'src/services/server.service';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(ServerService.name, () => {
  let sut: ServerService;

  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, storageMock, systemMock, userMock } = newTestService(ServerService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getStorage', () => {
    it('should return the disk space as B', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({ free: 200, available: 300, total: 500 });

      await expect(sut.getStorage()).resolves.toEqual({
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

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '293.0 KiB',
        diskAvailableRaw: 300_000,
        diskSize: '488.3 KiB',
        diskSizeRaw: 500_000,
        diskUsagePercentage: 60,
        diskUse: '293.0 KiB',
        diskUseRaw: 300_000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as MiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({ free: 200_000_000, available: 300_000_000, total: 500_000_000 });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '286.1 MiB',
        diskAvailableRaw: 300_000_000,
        diskSize: '476.8 MiB',
        diskSizeRaw: 500_000_000,
        diskUsagePercentage: 60,
        diskUse: '286.1 MiB',
        diskUseRaw: 300_000_000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as GiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000,
        available: 300_000_000_000,
        total: 500_000_000_000,
      });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '279.4 GiB',
        diskAvailableRaw: 300_000_000_000,
        diskSize: '465.7 GiB',
        diskSizeRaw: 500_000_000_000,
        diskUsagePercentage: 60,
        diskUse: '279.4 GiB',
        diskUseRaw: 300_000_000_000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as TiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000_000,
        available: 300_000_000_000_000,
        total: 500_000_000_000_000,
      });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '272.8 TiB',
        diskAvailableRaw: 300_000_000_000_000,
        diskSize: '454.7 TiB',
        diskSizeRaw: 500_000_000_000_000,
        diskUsagePercentage: 60,
        diskUse: '272.8 TiB',
        diskUseRaw: 300_000_000_000_000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });

    it('should return the disk space as PiB', async () => {
      storageMock.checkDiskUsage.mockResolvedValue({
        free: 200_000_000_000_000_000,
        available: 300_000_000_000_000_000,
        total: 500_000_000_000_000_000,
      });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '266.5 PiB',
        diskAvailableRaw: 300_000_000_000_000_000,
        diskSize: '444.1 PiB',
        diskSizeRaw: 500_000_000_000_000_000,
        diskUsagePercentage: 60,
        diskUse: '266.5 PiB',
        diskUseRaw: 300_000_000_000_000_000,
      });

      expect(storageMock.checkDiskUsage).toHaveBeenCalledWith('upload/library');
    });
  });

  describe('ping', () => {
    it('should respond with pong', () => {
      expect(sut.ping()).toEqual({ res: 'pong' });
    });
  });

  describe('getFeatures', () => {
    it('should respond the server features', async () => {
      await expect(sut.getFeatures()).resolves.toEqual({
        smartSearch: true,
        duplicateDetection: true,
        facialRecognition: true,
        importFaces: false,
        map: true,
        reverseGeocoding: true,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: true,
        sidecar: true,
        configFile: false,
        trash: true,
        email: false,
      });
      expect(systemMock.get).toHaveBeenCalled();
    });
  });

  describe('getSystemConfig', () => {
    it('should respond the server configuration', async () => {
      await expect(sut.getSystemConfig()).resolves.toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        trashDays: 30,
        userDeleteDelay: 7,
        isInitialized: undefined,
        isOnboarded: false,
        externalDomain: '',
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
      });
      expect(systemMock.get).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should total up usage by user', async () => {
      userMock.getUserStats.mockResolvedValue([
        {
          userId: 'user1',
          userName: '1 User',
          photos: 10,
          videos: 11,
          usage: 12_345,
          quotaSizeInBytes: 0,
        },
        {
          userId: 'user2',
          userName: '2 User',
          photos: 10,
          videos: 20,
          usage: 123_456,
          quotaSizeInBytes: 0,
        },
        {
          userId: 'user3',
          userName: '3 User',
          photos: 100,
          videos: 0,
          usage: 987_654,
          quotaSizeInBytes: 0,
        },
      ]);

      await expect(sut.getStatistics()).resolves.toEqual({
        photos: 120,
        videos: 31,
        usage: 1_123_455,
        usageByUser: [
          {
            photos: 10,
            quotaSizeInBytes: 0,
            usage: 12_345,
            userName: '1 User',
            userId: 'user1',
            videos: 11,
          },
          {
            photos: 10,
            quotaSizeInBytes: 0,
            usage: 123_456,
            userName: '2 User',
            userId: 'user2',
            videos: 20,
          },
          {
            photos: 100,
            quotaSizeInBytes: 0,
            usage: 987_654,
            userName: '3 User',
            userId: 'user3',
            videos: 0,
          },
        ],
      });

      expect(userMock.getUserStats).toHaveBeenCalled();
    });
  });

  describe('setLicense', () => {
    it('should save license if valid', async () => {
      systemMock.set.mockResolvedValue();

      const license = { licenseKey: 'IMSV-license-key', activationKey: 'activation-key' };
      await sut.setLicense(license);

      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.LICENSE, expect.any(Object));
    });

    it('should not save license if invalid', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'license-key', activationKey: 'activation-key' };
      const call = sut.setLicense(license);
      await expect(call).rejects.toThrowError('Invalid license key');
      expect(userMock.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('deleteLicense', () => {
    it('should delete license', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      await sut.deleteLicense();
      expect(userMock.upsertMetadata).not.toHaveBeenCalled();
    });
  });
});
