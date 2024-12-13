import { DateTime } from 'luxon';
import { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { ImmichEnvironment, SystemMetadataKey } from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';
import { VersionService } from 'src/services/version.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

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

  let configMock: Mocked<IConfigRepository>;
  let eventMock: Mocked<IEventRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let serverInfoMock: Mocked<IServerInfoRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let versionHistoryMock: Mocked<IVersionHistoryRepository>;

  beforeEach(() => {
    ({ sut, configMock, eventMock, jobMock, loggerMock, serverInfoMock, systemMock, versionHistoryMock } =
      newTestService(VersionService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should record a new version', async () => {
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(versionHistoryMock.create).toHaveBeenCalledWith({ version: expect.any(String) });
    });

    it('should skip a duplicate version', async () => {
      versionHistoryMock.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(versionHistoryMock.create).not.toHaveBeenCalled();
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
      versionHistoryMock.getAll.mockResolvedValue([upgrade]);
      await expect(sut.getVersionHistory()).resolves.toEqual([upgrade]);
    });
  });

  describe('handQueueVersionCheck', () => {
    it('should queue a version check job', async () => {
      await expect(sut.handleQueueVersionCheck()).resolves.toBeUndefined();
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.VERSION_CHECK, data: {} });
    });
  });

  describe('handVersionCheck', () => {
    beforeEach(() => {
      configMock.getEnv.mockReturnValue(mockEnvData({ environment: ImmichEnvironment.PRODUCTION }));
    });

    it('should not run in dev mode', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ environment: ImmichEnvironment.DEVELOPMENT }));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should not run if the last check was < 60 minutes ago', async () => {
      systemMock.get.mockResolvedValue({
        checkedAt: DateTime.utc().minus({ minutes: 5 }).toISO(),
        releaseVersion: '1.0.0',
      });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should not run if version check is disabled', async () => {
      systemMock.get.mockResolvedValue({ newVersionCheck: { enabled: false } });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SKIPPED);
    });

    it('should run if it has been > 60 minutes', async () => {
      serverInfoMock.getGitHubRelease.mockResolvedValue(mockRelease('v100.0.0'));
      systemMock.get.mockResolvedValue({
        checkedAt: DateTime.utc().minus({ minutes: 65 }).toISO(),
        releaseVersion: '1.0.0',
      });
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(systemMock.set).toHaveBeenCalled();
      expect(loggerMock.log).toHaveBeenCalled();
      expect(eventMock.clientBroadcast).toHaveBeenCalled();
    });

    it('should not notify if the version is equal', async () => {
      serverInfoMock.getGitHubRelease.mockResolvedValue(mockRelease(serverVersion.toString()));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.VERSION_CHECK_STATE, {
        checkedAt: expect.any(String),
        releaseVersion: serverVersion.toString(),
      });
      expect(eventMock.clientBroadcast).not.toHaveBeenCalled();
    });

    it('should handle a github error', async () => {
      serverInfoMock.getGitHubRelease.mockRejectedValue(new Error('GitHub is down'));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.FAILED);
      expect(systemMock.set).not.toHaveBeenCalled();
      expect(eventMock.clientBroadcast).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('onWebsocketConnectionEvent', () => {
    it('should send on_server_version client event', async () => {
      await sut.onWebsocketConnection({ userId: '42' });
      expect(eventMock.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(eventMock.clientSend).toHaveBeenCalledTimes(1);
    });

    it('should also send a new release notification', async () => {
      systemMock.get.mockResolvedValue({ checkedAt: '2024-01-01', releaseVersion: 'v1.42.0' });
      await sut.onWebsocketConnection({ userId: '42' });
      expect(eventMock.clientSend).toHaveBeenCalledWith('on_server_version', '42', expect.any(SemVer));
      expect(eventMock.clientSend).toHaveBeenCalledWith('on_new_release', '42', expect.any(Object));
    });
  });
});
