import { AuthDto } from 'src/dtos/auth.dto';
import { SystemMetadataKey } from 'src/enum';
import { ServerService } from 'src/services/server.service';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

const ONE_TB = 1024 * 1024 * 1024 * 1024;

const makeAuth = (quotaSizeInBytes: number | null, quotaUsageInBytes: number): AuthDto => ({
  user: {
    id: 'user-id',
    name: 'Test User',
    email: 'test@test.com',
    isAdmin: false,
    quotaSizeInBytes,
    quotaUsageInBytes,
  },
});

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
    it('should return user quota with default 1TB when quotaSizeInBytes is null', async () => {
      const auth = makeAuth(null, 300_000_000_000); // null quota, 300GB used

      await expect(sut.getStorage(auth)).resolves.toEqual({
        diskAvailable: '744.6 GiB',
        diskAvailableRaw: ONE_TB - 300_000_000_000,
        diskSize: '1.0 TiB',
        diskSizeRaw: ONE_TB,
        diskUsagePercentage: 27.28,
        diskUse: '279.4 GiB',
        diskUseRaw: 300_000_000_000,
      });
    });

    it('should return user quota when quotaSizeInBytes is set', async () => {
      const auth = makeAuth(500_000_000_000, 300_000_000_000); // 500GB quota, 300GB used

      await expect(sut.getStorage(auth)).resolves.toEqual({
        diskAvailable: '186.3 GiB',
        diskAvailableRaw: 200_000_000_000,
        diskSize: '465.7 GiB',
        diskSizeRaw: 500_000_000_000,
        diskUsagePercentage: 60,
        diskUse: '279.4 GiB',
        diskUseRaw: 300_000_000_000,
      });
    });

    it('should return 0 available when usage exceeds quota', async () => {
      const auth = makeAuth(100_000_000_000, 150_000_000_000); // 100GB quota, 150GB used

      await expect(sut.getStorage(auth)).resolves.toEqual({
        diskAvailable: '0 B',
        diskAvailableRaw: 0,
        diskSize: '93.1 GiB',
        diskSizeRaw: 100_000_000_000,
        diskUsagePercentage: 150,
        diskUse: '139.7 GiB',
        diskUseRaw: 150_000_000_000,
      });
    });

    it('should use authStub correctly', async () => {
      // authStub.user1 has quotaSizeInBytes: null and quotaUsageInBytes: 0
      await expect(sut.getStorage(authStub.user1)).resolves.toEqual({
        diskAvailable: '1.0 TiB',
        diskAvailableRaw: ONE_TB,
        diskSize: '1.0 TiB',
        diskSizeRaw: ONE_TB,
        diskUsagePercentage: 0,
        diskUse: '0 B',
        diskUseRaw: 0,
      });
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
});
