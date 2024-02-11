import { SystemMetadataKey } from '@app/infra/entities';
import {
  newCommunicationRepositoryMock,
  newServerInfoRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  newSystemMetadataRepositoryMock,
  newUserRepositoryMock,
} from '@test';
import { serverVersion } from '../domain.constant';
import {
  ICommunicationRepository,
  IServerInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ISystemMetadataRepository,
  IUserRepository,
} from '../repositories';
import { ServerInfoService } from './server-info.service';

describe(ServerInfoService.name, () => {
  let sut: ServerInfoService;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let serverInfoMock: jest.Mocked<IServerInfoRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let systemMetadataMock: jest.Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    configMock = newSystemConfigRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    serverInfoMock = newServerInfoRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    systemMetadataMock = newSystemMetadataRepositoryMock();

    sut = new ServerInfoService(
      communicationMock,
      configMock,
      userMock,
      serverInfoMock,
      storageMock,
      systemMetadataMock,
    );
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

      await expect(sut.getInfo()).resolves.toEqual({
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

      await expect(sut.getInfo()).resolves.toEqual({
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

      await expect(sut.getInfo()).resolves.toEqual({
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

      await expect(sut.getInfo()).resolves.toEqual({
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

  describe('getVersion', () => {
    it('should respond the server version', () => {
      expect(sut.getVersion()).toEqual(serverVersion);
    });
  });

  describe('getFeatures', () => {
    it('should respond the server features', async () => {
      await expect(sut.getFeatures()).resolves.toEqual({
        smartSearch: true,
        facialRecognition: true,
        map: true,
        reverseGeocoding: true,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: true,
        sidecar: true,
        configFile: false,
        trash: true,
      });
      expect(configMock.load).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should respond the server configuration', async () => {
      await expect(sut.getConfig()).resolves.toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        trashDays: 30,
        isInitialized: undefined,
        isOnboarded: false,
        externalDomain: '',
      });
      expect(configMock.load).toHaveBeenCalled();
    });
  });

  describe('setAdminOnboarding', () => {
    it('should set admin onboarding to true', async () => {
      await sut.setAdminOnboarding();
      expect(systemMetadataMock.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: true });
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
});
