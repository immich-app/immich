import { BadRequestException, NotFoundException } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import { SystemMetadataKey } from 'src/enum';
import { ServerService } from 'src/services/server.service';
import { mimeTypes } from 'src/utils/mime-types';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';

describe(ServerService.name, () => {
  let sut: ServerService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ServerService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getStorage', () => {
    it('should return the disk space as B', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({ free: 200, available: 300, total: 500 });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '300 B',
        diskAvailableRaw: 300,
        diskSize: '500 B',
        diskSizeRaw: 500,
        diskUsagePercentage: 60,
        diskUse: '300 B',
        diskUseRaw: 300,
      });

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
    });

    it('should return the disk space as KiB', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({ free: 200_000, available: 300_000, total: 500_000 });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '293.0 KiB',
        diskAvailableRaw: 300_000,
        diskSize: '488.3 KiB',
        diskSizeRaw: 500_000,
        diskUsagePercentage: 60,
        diskUse: '293.0 KiB',
        diskUseRaw: 300_000,
      });

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
    });

    it('should return the disk space as MiB', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({ free: 200_000_000, available: 300_000_000, total: 500_000_000 });

      await expect(sut.getStorage()).resolves.toEqual({
        diskAvailable: '286.1 MiB',
        diskAvailableRaw: 300_000_000,
        diskSize: '476.8 MiB',
        diskSizeRaw: 500_000_000,
        diskUsagePercentage: 60,
        diskUse: '286.1 MiB',
        diskUseRaw: 300_000_000,
      });

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
    });

    it('should return the disk space as GiB', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({
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

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
    });

    it('should return the disk space as TiB', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({
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

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
    });

    it('should return the disk space as PiB', async () => {
      mocks.storage.checkDiskUsage.mockResolvedValue({
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

      expect(mocks.storage.checkDiskUsage).toHaveBeenCalledWith(expect.stringContaining('/data/library'));
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
        ocr: true,
        passwordLogin: true,
        search: true,
        sidecar: true,
        configFile: false,
        trash: true,
        email: false,
      });
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
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
        publicUsers: true,
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
        maintenanceMode: false,
      });
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should total up usage by user', async () => {
      mocks.user.getUserStats.mockResolvedValue([
        {
          userId: 'user1',
          userName: '1 User',
          photos: 10,
          videos: 11,
          usage: 12_345,
          usagePhotos: 1,
          usageVideos: 11_345,
          quotaSizeInBytes: 0,
        },
        {
          userId: 'user2',
          userName: '2 User',
          photos: 10,
          videos: 20,
          usage: 123_456,
          usagePhotos: 100,
          usageVideos: 23_456,
          quotaSizeInBytes: 0,
        },
        {
          userId: 'user3',
          userName: '3 User',
          photos: 100,
          videos: 0,
          usage: 987_654,
          usagePhotos: 900,
          usageVideos: 87_654,
          quotaSizeInBytes: 0,
        },
      ]);

      await expect(sut.getStatistics()).resolves.toEqual({
        photos: 120,
        videos: 31,
        usage: 1_123_455,
        usagePhotos: 1001,
        usageVideos: 122_455,
        usageByUser: [
          {
            photos: 10,
            quotaSizeInBytes: 0,
            usage: 12_345,
            usagePhotos: 1,
            usageVideos: 11_345,
            userName: '1 User',
            userId: 'user1',
            videos: 11,
          },
          {
            photos: 10,
            quotaSizeInBytes: 0,
            usage: 123_456,
            usagePhotos: 100,
            usageVideos: 23_456,
            userName: '2 User',
            userId: 'user2',
            videos: 20,
          },
          {
            photos: 100,
            quotaSizeInBytes: 0,
            usage: 987_654,
            usagePhotos: 900,
            usageVideos: 87_654,
            userName: '3 User',
            userId: 'user3',
            videos: 0,
          },
        ],
      });

      expect(mocks.user.getUserStats).toHaveBeenCalled();
    });
  });

  describe('setLicense', () => {
    it('should save license if valid', async () => {
      mocks.systemMetadata.set.mockResolvedValue();

      const license = { licenseKey: 'IMSV-license-key', activationKey: 'activation-key' };
      await sut.setLicense(license);

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.License, expect.any(Object));
    });

    it('should not save license if invalid', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'license-key', activationKey: 'activation-key' };
      const call = sut.setLicense(license);
      await expect(call).rejects.toThrowError('Invalid license key');
      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('deleteLicense', () => {
    it('should delete license', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.deleteLicense();
      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('getAboutInfo', () => {
    it('should return about info', async () => {
      mocks.serverInfo.getBuildVersions.mockResolvedValue({
        nodejs: '18.0.0',
        ffmpeg: '6.0',
        imagemagick: '7.1.0',
        libvips: '8.14.0',
        exiftool: '12.0',
      });
      mocks.systemMetadata.get.mockResolvedValue(null);

      const result = await sut.getAboutInfo();
      expect(result).toEqual(
        expect.objectContaining({
          version: expect.any(String),
          versionUrl: expect.stringContaining('https://github.com/immich-app/immich/releases/tag/'),
          licensed: false,
        }),
      );
      expect(mocks.serverInfo.getBuildVersions).toHaveBeenCalled();
    });

    it('should return licensed true when license exists', async () => {
      mocks.serverInfo.getBuildVersions.mockResolvedValue({});
      mocks.systemMetadata.get.mockResolvedValue({ licenseKey: 'IMSV-key', activationKey: 'key' });

      const result = await sut.getAboutInfo();
      expect(result.licensed).toBe(true);
    });
  });

  describe('onBootstrap', () => {
    it('should set admin onboarding when config file is used', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({}));

      await sut.onBootstrap();

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.AdminOnboarding, {
        isOnboarded: true,
      });
    });

    it('should not set admin onboarding when no config file is used', async () => {
      await sut.onBootstrap();

      expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(
        SystemMetadataKey.AdminOnboarding,
        expect.anything(),
      );
    });
  });

  describe('getTheme', () => {
    it('should return the theme config', async () => {
      const result = await sut.getTheme();
      expect(result).toEqual({ customCss: '' });
    });
  });

  describe('getLicense', () => {
    it('should return license when it exists', async () => {
      const license = { licenseKey: 'IMSV-key', activationKey: 'key', activatedAt: new Date() };
      mocks.systemMetadata.get.mockResolvedValue(license);

      await expect(sut.getLicense()).resolves.toEqual(license);
    });

    it('should throw NotFoundException when license does not exist', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);

      await expect(sut.getLicense()).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setLicense', () => {
    it('should throw BadRequestException if license key does not start with IMSV-', async () => {
      const license = { licenseKey: 'INVALID-key', activationKey: 'activation-key' };

      await expect(sut.setLicense(license)).rejects.toThrow(BadRequestException);
      await expect(sut.setLicense(license)).rejects.toThrow('Invalid license key');
    });

    it('should throw BadRequestException if license verification fails', async () => {
      mocks.crypto.verifySha256.mockReturnValue(false);

      const license = { licenseKey: 'IMSV-valid-key', activationKey: 'invalid-activation' };

      await expect(sut.setLicense(license)).rejects.toThrow(BadRequestException);
    });

    it('should save and return license data with activatedAt date', async () => {
      mocks.crypto.verifySha256.mockReturnValue(true);
      mocks.systemMetadata.set.mockResolvedValue();

      const license = { licenseKey: 'IMSV-valid-key', activationKey: 'valid-activation' };
      const result = await sut.setLicense(license);

      expect(result).toEqual(
        expect.objectContaining({
          licenseKey: 'IMSV-valid-key',
          activationKey: 'valid-activation',
          activatedAt: expect.any(Date),
        }),
      );
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
        SystemMetadataKey.License,
        expect.objectContaining({ licenseKey: 'IMSV-valid-key', activatedAt: expect.any(Date) }),
      );
    });
  });

  describe('deleteLicense', () => {
    it('should delete license from system metadata', async () => {
      await sut.deleteLicense();

      expect(mocks.systemMetadata.delete).toHaveBeenCalledWith(SystemMetadataKey.License);
    });
  });

  describe('getApkLinks', () => {
    it('should return APK download links', () => {
      const result = sut.getApkLinks();
      const version = serverVersion.toString();

      expect(result).toEqual({
        arm64v8a: `https://github.com/immich-app/immich/releases/download/v${version}/app-arm64-v8a-release.apk`,
        armeabiv7a: `https://github.com/immich-app/immich/releases/download/v${version}/app-armeabi-v7a-release.apk`,
        universal: `https://github.com/immich-app/immich/releases/download/v${version}/app-release.apk`,
        x86_64: `https://github.com/immich-app/immich/releases/download/v${version}/app-x86_64-release.apk`,
      });
    });
  });

  describe('getSupportedMediaTypes', () => {
    it('should return supported media types', () => {
      const result = sut.getSupportedMediaTypes();

      expect(result).toEqual({
        video: Object.keys(mimeTypes.video),
        image: Object.keys(mimeTypes.image),
        sidecar: Object.keys(mimeTypes.sidecar),
      });
    });
  });

  describe('getFeatures', () => {
    it('should reflect configFile feature flag when config file is used', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({}));

      const result = await sut.getFeatures();

      expect(result.configFile).toBe(true);
    });

    it('should reflect disabled machine learning features', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: { enabled: false },
      });

      const result = await sut.getFeatures();

      expect(result.smartSearch).toBe(false);
      expect(result.facialRecognition).toBe(false);
      expect(result.duplicateDetection).toBe(false);
      expect(result.ocr).toBe(false);
    });

    it('should reflect enabled oauth', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { enabled: true, autoLaunch: true },
      });

      const result = await sut.getFeatures();

      expect(result.oauth).toBe(true);
      expect(result.oauthAutoLaunch).toBe(true);
    });

    it('should reflect enabled email notifications', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        notifications: { smtp: { enabled: true } },
      });

      const result = await sut.getFeatures();

      expect(result.email).toBe(true);
    });

    it('should reflect disabled map', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        map: { enabled: false },
      });

      const result = await sut.getFeatures();

      expect(result.map).toBe(false);
    });

    it('should reflect disabled trash', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        trash: { enabled: false },
      });

      const result = await sut.getFeatures();

      expect(result.trash).toBe(false);
    });
  });

  describe('getSystemConfig', () => {
    it('should return isInitialized true when admin user exists', async () => {
      mocks.user.hasAdmin.mockResolvedValue(true);

      const result = await sut.getSystemConfig();

      expect(result.isInitialized).toBe(true);
    });

    it('should return isOnboarded true when onboarding is completed', async () => {
      mocks.systemMetadata.get.mockImplementation((key) => {
        if (key === SystemMetadataKey.AdminOnboarding) {
          return Promise.resolve({ isOnboarded: true });
        }
        return Promise.resolve(null);
      });

      const result = await sut.getSystemConfig();

      expect(result.isOnboarded).toBe(true);
    });

    it('should return isInitialized based on setup.allow false', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ setup: { allow: false } }));

      const result = await sut.getSystemConfig();

      expect(result.isInitialized).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return empty stats when no users exist', async () => {
      mocks.user.getUserStats.mockResolvedValue([]);

      const result = await sut.getStatistics();

      expect(result).toEqual({
        photos: 0,
        videos: 0,
        usage: 0,
        usagePhotos: 0,
        usageVideos: 0,
        usageByUser: [],
      });
    });
  });
});
