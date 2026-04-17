import { DateTime } from 'luxon';
import { SemVer } from 'semver';
import { defaults } from 'src/config';
import { serverVersion } from 'src/constants';
import { CronJob, JobName, JobStatus, SystemMetadataKey } from 'src/enum';
import { VersionService } from 'src/services/version.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const mockVersionResponse = (version: string) => ({
  version,
  published_at: DateTime.utc().toISO(),
});

describe(VersionService.name, () => {
  let sut: VersionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(VersionService));
    mocks.cron.create.mockResolvedValue();
    mocks.cron.update.mockResolvedValue();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should record a new version', async () => {
      mocks.versionHistory.getAll.mockResolvedValue([]);
      mocks.versionHistory.getLatest.mockResolvedValue(void 0);
      mocks.versionHistory.create.mockResolvedValue(factory.versionHistory());

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(mocks.versionHistory.create).toHaveBeenCalledWith({ version: expect.any(String) });
    });

    it('should skip a duplicate version', async () => {
      mocks.versionHistory.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(mocks.versionHistory.create).not.toHaveBeenCalled();
    });

    it('should create a version check cron job when the database lock is acquired', async () => {
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.versionHistory.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await sut.onBootstrap();
      expect(mocks.cron.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: CronJob.VersionCheck,
        }),
      );
    });
  });

  describe('getVersion', () => {
    it('should respond the server version', () => {
      expect(sut.getVersion()).toEqual({
        major: serverVersion.major,
        minor: serverVersion.minor,
        patch: serverVersion.patch,
      });
    });
  });

  describe('getVersionHistory', () => {
    it('should respond the server version history', async () => {
      const upgrade = { id: 'upgrade-1', createdAt: new Date(), version: '1.0.0' };
      mocks.versionHistory.getAll.mockResolvedValue([upgrade]);
      await expect(sut.getVersionHistory()).resolves.toEqual([upgrade]);
    });
  });

  describe('handQueueVersionCheck', () => {
    it('should queue a version check job', async () => {
      await expect(sut.handleQueueVersionCheck()).resolves.toBeUndefined();
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.VersionCheck, data: {} });
    });
  });

  describe('handVersionCheck', () => {
    it('should not run if version check is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ newVersionCheck: { enabled: false } });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Skipped);
    });

    it('should skip if the last check was less than 50 seconds ago', async () => {
      mocks.systemMetadata.get.mockResolvedValueOnce(null).mockResolvedValueOnce({
        checkedAt: DateTime.utc().minus({ seconds: 30 }).toISO(),
        releaseVersion: '1.0.0',
      });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Skipped);
      expect(mocks.serverInfo.getLatestRelease).not.toHaveBeenCalled();
    });

    it('should run if the last check was more than 50 seconds ago', async () => {
      mocks.systemMetadata.get.mockResolvedValueOnce(null).mockResolvedValueOnce({
        checkedAt: DateTime.utc().minus({ seconds: 60 }).toISO(),
        releaseVersion: '1.0.0',
      });
      mocks.serverInfo.getLatestRelease.mockResolvedValue(mockVersionResponse(serverVersion.toString()));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Success);
      expect(mocks.serverInfo.getLatestRelease).toHaveBeenCalled();
    });

    it('should run and notify if a new version is available', async () => {
      mocks.serverInfo.getLatestRelease.mockResolvedValue(mockVersionResponse('v100.0.0'));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Success);
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
      expect(mocks.logger.log).toHaveBeenCalled();
      expect(mocks.websocket.clientBroadcast).toHaveBeenCalled();
    });

    it('should not notify if the version is equal', async () => {
      mocks.serverInfo.getLatestRelease.mockResolvedValue(mockVersionResponse(serverVersion.toString()));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Success);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.VersionCheckState, {
        checkedAt: expect.any(String),
        releaseVersion: serverVersion.toString(),
      });
      expect(mocks.websocket.clientBroadcast).not.toHaveBeenCalled();
    });

    it('should handle a version check error', async () => {
      mocks.serverInfo.getLatestRelease.mockRejectedValue(new Error('Version service is down'));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.Failed);
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.websocket.clientBroadcast).not.toHaveBeenCalled();
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  describe('onConfigUpdate', () => {
    it('should queue a version check job when newVersionCheck is enabled', async () => {
      await sut.onConfigUpdate({
        oldConfig: { ...defaults, newVersionCheck: { enabled: false } },
        newConfig: { ...defaults, newVersionCheck: { enabled: true } },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.VersionCheck, data: {} });
    });

    it('should not queue a version check job when newVersionCheck is disabled', async () => {
      await sut.onConfigUpdate({
        oldConfig: { ...defaults, newVersionCheck: { enabled: true } },
        newConfig: { ...defaults, newVersionCheck: { enabled: false } },
      });
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should not queue a version check job when newVersionCheck was already enabled', async () => {
      await sut.onConfigUpdate({
        oldConfig: { ...defaults, newVersionCheck: { enabled: true } },
        newConfig: { ...defaults, newVersionCheck: { enabled: true } },
      });
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('onWebsocketConnection', () => {
    it('should send on_server_version client event', async () => {
      await sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.websocket.clientSend).toHaveBeenCalledTimes(1);
    });

    it('should also send a new release notification', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ checkedAt: '2024-01-01', releaseVersion: 'v1.42.0' });
      await sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_new_release', '42', expect.any(Object));
    });

    it('should not send a release notification when the version check is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValueOnce({ newVersionCheck: { enabled: false } });
      await sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.websocket.clientSend).not.toHaveBeenCalledWith('on_new_release', '42', expect.any(Object));
    });
  });
});
