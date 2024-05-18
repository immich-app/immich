import { DateTime } from 'luxon';
import { serverVersion } from 'src/constants';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { VersionService } from 'src/services/version.service';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newServerInfoRepositoryMock } from 'test/repositories/system-info.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

const mockRelease = (version = '100.0.0') => ({
  id: 1,
  url: 'https://api.github.com/repos/owner/repo/releases/1',
  tag_name: 'v' + version,
  name: 'Release 1000',
  created_at: DateTime.utc().toISO(),
  published_at: DateTime.utc().toISO(),
  body: '',
});

describe(VersionService.name, () => {
  let sut: VersionService;
  let eventMock: Mocked<IEventRepository>;
  let jobMock: Mocked<IJobRepository>;
  let serverMock: Mocked<IServerInfoRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    eventMock = newEventRepositoryMock();
    jobMock = newJobRepositoryMock();
    serverMock = newServerInfoRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new VersionService(eventMock, jobMock, serverMock, systemMock, loggerMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getVersion', () => {
    it('should respond the server version', () => {
      expect(sut.getVersion()).toEqual(serverVersion);
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
      process.env.IMMICH_ENV = 'production';
    });

    it('should not run in dev mode', async () => {
      process.env.IMMICH_ENV = 'development';
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
      serverMock.getGitHubRelease.mockResolvedValue(mockRelease());
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
