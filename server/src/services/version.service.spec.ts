import { DateTime } from 'luxon';
import { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { ImmichEnvironment, JobName, JobStatus, SystemMetadataKey } from 'src/enum';
import { VersionService } from 'src/services/version.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const mockRelease = (version: string) => ({
  id: 1,
  url: 'https://api.github.com/repos/owner/repo/releases/1',
  tag_name: version,
  name: 'Release 1000',
  created_at: DateTime.utc().toISO(),
  published_at: DateTime.utc().toISO(),
  body: '',
});

describe(VersionService.name, () => {
  let sut: VersionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(VersionService));
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
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.VERSION_CHECK, data: {} });
    });
  });

  describe('handVersionCheck', () => {
    beforeEach(() => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ environment: ImmichEnvironment.PRODUCTION }));
    });

    it('should not run in dev mode', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ environment: ImmichEnvironment.DEVELOPMENT }));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should not run if the last check was < 60 minutes ago', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        checkedAt: DateTime.utc().minus({ minutes: 5 }).toISO(),
        releaseVersion: '1.0.0',
      });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should not run if version check is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ newVersionCheck: { enabled: false } });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should run if it has been > 60 minutes', async () => {
      mocks.serverInfo.getGitHubRelease.mockResolvedValue(mockRelease('v100.0.0'));
      mocks.systemMetadata.get.mockResolvedValue({
        checkedAt: DateTime.utc().minus({ minutes: 65 }).toISO(),
        releaseVersion: '1.0.0',
      });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(mocks.systemMetadata.set).toHaveBeenCalled();
      expect(mocks.logger.log).toHaveBeenCalled();
      expect(mocks.event.clientBroadcast).toHaveBeenCalled();
    });

    it('should not notify if the version is equal', async () => {
      mocks.serverInfo.getGitHubRelease.mockResolvedValue(mockRelease(serverVersion.toString()));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.VERSION_CHECK_STATE, {
        checkedAt: expect.any(String),
        releaseVersion: serverVersion.toString(),
      });
      expect(mocks.event.clientBroadcast).not.toHaveBeenCalled();
    });

    it('should handle a github error', async () => {
      mocks.serverInfo.getGitHubRelease.mockRejectedValue(new Error('GitHub is down'));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.FAILED);
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.event.clientBroadcast).not.toHaveBeenCalled();
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  describe('onWebsocketConnectionEvent', () => {
    it('should send on_server_version client event', async () => {
      await sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.event.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.event.clientSend).toHaveBeenCalledTimes(1);
    });

    it('should also send a new release notification', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ checkedAt: '2024-01-01', releaseVersion: 'v1.42.0' });
      await sut.onWebsocketConnection({ userId: '42' });
      expect(mocks.event.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(mocks.event.clientSend).toHaveBeenCalledWith('on_new_release', '42', expect.any(Object));
    });
  });
});
