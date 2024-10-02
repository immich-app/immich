import { DateTime } from 'luxon';
import { serverVersion } from 'src/constants';
import { ImmichEnvironment, SystemMetadataKey } from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';
import { VersionService } from 'src/services/version.service';
import { mockEnvData, newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newServerInfoRepositoryMock } from 'test/repositories/server-info.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newVersionHistoryRepositoryMock } from 'test/repositories/version-history.repository.mock';
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
  let databaseMock: Mocked<IDatabaseRepository>;
  let eventMock: Mocked<IEventRepository>;
  let jobMock: Mocked<IJobRepository>;
  let serverMock: Mocked<IServerInfoRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let versionMock: Mocked<IVersionHistoryRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    configMock = newConfigRepositoryMock();
    databaseMock = newDatabaseRepositoryMock();
    eventMock = newEventRepositoryMock();
    jobMock = newJobRepositoryMock();
    serverMock = newServerInfoRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    versionMock = newVersionHistoryRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new VersionService(
      configMock,
      databaseMock,
      eventMock,
      jobMock,
      serverMock,
      systemMock,
      versionMock,
      loggerMock,
    );
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should record a new version', async () => {
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(versionMock.create).toHaveBeenCalledWith({ version: expect.any(String) });
    });

    it('should skip a duplicate version', async () => {
      versionMock.getLatest.mockResolvedValue({
        id: 'version-1',
        createdAt: new Date(),
        version: serverVersion.toString(),
      });
      await expect(sut.onBootstrap()).resolves.toBeUndefined();
      expect(versionMock.create).not.toHaveBeenCalled();
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
      versionMock.getAll.mockResolvedValue([upgrade]);
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

    it('should run if it has been > 60 minutes', async () => {
      serverMock.getGitHubRelease.mockResolvedValue(mockRelease('v100.0.0'));
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
      serverMock.getGitHubRelease.mockResolvedValue(mockRelease(serverVersion.toString()));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.SUCCESS);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.VERSION_CHECK_STATE, {
        checkedAt: expect.any(String),
        releaseVersion: serverVersion.toString(),
      });
      expect(eventMock.clientBroadcast).not.toHaveBeenCalled();
    });

    it('should handle a github error', async () => {
      serverMock.getGitHubRelease.mockRejectedValue(new Error('GitHub is down'));
      await expect(sut.handleVersionCheck()).resolves.toEqual(JobStatus.FAILED);
      expect(systemMock.set).not.toHaveBeenCalled();
      expect(eventMock.clientBroadcast).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
