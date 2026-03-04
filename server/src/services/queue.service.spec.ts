import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import { ImmichWorker, JobName, QueueCleanType, QueueCommand, QueueName } from 'src/enum';
import { QueueService } from 'src/services/queue.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(QueueService.name, () => {
  let sut: QueueService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(QueueService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigInit', () => {
    it('should update concurrency on microservices worker', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

      await sut.onConfigInit({ newConfig: defaults });

      expect(mocks.job.setConcurrency).toHaveBeenCalled();
      expect(mocks.database.tryLock).not.toHaveBeenCalled();
    });

    it('should schedule nightly jobs on non-microservices worker when lock acquired', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockImplementation(() => {});

      await sut.onConfigInit({ newConfig: defaults });

      expect(mocks.database.tryLock).toHaveBeenCalled();
      expect(mocks.cron.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NightlyJobs',
          expression: '0 0 * * *',
          start: true,
        }),
      );
    });

    it('should not schedule nightly jobs when lock is not acquired', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
      mocks.database.tryLock.mockResolvedValue(false);

      await sut.onConfigInit({ newConfig: defaults });

      expect(mocks.cron.create).not.toHaveBeenCalled();
    });

    it('should parse custom nightly task start time', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockImplementation(() => {});

      const config = { ...defaults, nightlyTasks: { ...defaults.nightlyTasks, startTime: '03:30' } };
      await sut.onConfigInit({ newConfig: config });

      expect(mocks.cron.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: '30 3 * * *',
        }),
      );
    });
  });

  describe('onConfigUpdate', () => {
    it('should update concurrency', () => {
      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.job.setConcurrency).toHaveBeenCalledTimes(18);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(5, QueueName.FacialRecognition, 1);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(7, QueueName.DuplicateDetection, 1);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(8, QueueName.BackgroundTask, 5);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(9, QueueName.StorageTemplateMigration, 1);
    });

    it('should update cron expression on non-microservices worker when lock held', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockImplementation(() => {});
      mocks.cron.update.mockImplementation(() => {});

      // First acquire the lock via onConfigInit
      await sut.onConfigInit({ newConfig: defaults });

      // Then trigger update
      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.cron.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NightlyJobs',
          expression: '0 0 * * *',
          start: true,
        }),
      );
    });

    it('should not update cron when lock is not held', () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
      // nightlyJobsLock is false by default

      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.cron.update).not.toHaveBeenCalled();
    });

    it('should update concurrency on microservices worker without touching cron', () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.job.setConcurrency).toHaveBeenCalled();
      expect(mocks.cron.update).not.toHaveBeenCalled();
    });
  });

  describe('onBootstrap', () => {
    it('should setup job repository', () => {
      sut.setServices([]);
      sut.onBootstrap();

      expect(mocks.job.setup).toHaveBeenCalledWith([]);
    });

    it('should start workers on microservices', () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

      sut.setServices([]);
      sut.onBootstrap();

      expect(mocks.job.setup).toHaveBeenCalled();
      expect(mocks.job.startWorkers).toHaveBeenCalled();
    });

    it('should not start workers on non-microservices', () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);

      sut.setServices([]);
      sut.onBootstrap();

      expect(mocks.job.setup).toHaveBeenCalled();
      expect(mocks.job.startWorkers).not.toHaveBeenCalled();
    });
  });

  describe('setServices', () => {
    it('should store service constructors', () => {
      class TestService {}
      sut.setServices([TestService]);
      sut.onBootstrap();

      expect(mocks.job.setup).toHaveBeenCalledWith([TestService]);
    });
  });

  describe('getAll', () => {
    it('should get all queue statuses', async () => {
      const stats = factory.queueStatistics();
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      const result = await sut.getAll(factory.auth());

      expect(result).toHaveLength(Object.values(QueueName).length);
      for (const item of result) {
        expect(item).toEqual({
          name: expect.any(String),
          isPaused: false,
          statistics: stats,
        });
      }
    });
  });

  describe('get', () => {
    it('should get a single queue status', async () => {
      const stats = factory.queueStatistics({ active: 3 });
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(true);

      const result = await sut.get(factory.auth(), QueueName.ThumbnailGeneration);

      expect(result).toEqual({
        name: QueueName.ThumbnailGeneration,
        isPaused: true,
        statistics: stats,
      });
    });
  });

  describe('update', () => {
    it('should pause a queue', async () => {
      const stats = factory.queueStatistics();
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(true);

      const result = await sut.update(factory.auth(), QueueName.MetadataExtraction, { isPaused: true });

      expect(mocks.job.pause).toHaveBeenCalledWith(QueueName.MetadataExtraction);
      expect(result).toEqual({
        name: QueueName.MetadataExtraction,
        isPaused: true,
        statistics: stats,
      });
    });

    it('should resume a queue', async () => {
      const stats = factory.queueStatistics();
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      const result = await sut.update(factory.auth(), QueueName.MetadataExtraction, { isPaused: false });

      expect(mocks.job.resume).toHaveBeenCalledWith(QueueName.MetadataExtraction);
      expect(result).toEqual({
        name: QueueName.MetadataExtraction,
        isPaused: false,
        statistics: stats,
      });
    });

    it('should throw when pausing BackgroundTask queue', async () => {
      await expect(
        sut.update(factory.auth(), QueueName.BackgroundTask, { isPaused: true }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.pause).not.toHaveBeenCalled();
    });

    it('should allow resuming BackgroundTask queue', async () => {
      const stats = factory.queueStatistics();
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      await sut.update(factory.auth(), QueueName.BackgroundTask, { isPaused: false });

      expect(mocks.job.resume).toHaveBeenCalledWith(QueueName.BackgroundTask);
    });

    it('should not pause or resume when isPaused is undefined', async () => {
      const stats = factory.queueStatistics();
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      await sut.update(factory.auth(), QueueName.MetadataExtraction, {});

      expect(mocks.job.pause).not.toHaveBeenCalled();
      expect(mocks.job.resume).not.toHaveBeenCalled();
    });
  });

  describe('searchJobs', () => {
    it('should search jobs in a queue', async () => {
      mocks.job.searchJobs.mockResolvedValue([]);

      const result = await sut.searchJobs(factory.auth(), QueueName.MetadataExtraction, {});

      expect(result).toEqual([]);
      expect(mocks.job.searchJobs).toHaveBeenCalledWith(QueueName.MetadataExtraction, {});
    });
  });

  describe('emptyQueue', () => {
    it('should empty a queue', async () => {
      await sut.emptyQueue(factory.auth(), QueueName.MetadataExtraction, {});

      expect(mocks.job.empty).toHaveBeenCalledWith(QueueName.MetadataExtraction);
      expect(mocks.job.clear).not.toHaveBeenCalled();
    });

    it('should also clear failed jobs when failed flag is true', async () => {
      await sut.emptyQueue(factory.auth(), QueueName.MetadataExtraction, { failed: true });

      expect(mocks.job.empty).toHaveBeenCalledWith(QueueName.MetadataExtraction);
      expect(mocks.job.clear).toHaveBeenCalledWith(QueueName.MetadataExtraction, QueueCleanType.Failed);
    });

    it('should not clear failed jobs when failed flag is false', async () => {
      await sut.emptyQueue(factory.auth(), QueueName.MetadataExtraction, { failed: false });

      expect(mocks.job.empty).toHaveBeenCalledWith(QueueName.MetadataExtraction);
      expect(mocks.job.clear).not.toHaveBeenCalled();
    });
  });

  describe('handleNightlyJobs', () => {
    it('should run the scheduled jobs', async () => {
      await sut.handleNightlyJobs();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDeleteCheck },
        { name: JobName.UserDeleteCheck },
        { name: JobName.PersonCleanup },
        { name: JobName.MemoryCleanup },
        { name: JobName.SessionCleanup },
        { name: JobName.AuditTableCleanup },
        { name: JobName.AuditLogCleanup },
        { name: JobName.MemoryGenerate },
        { name: JobName.UserSyncUsage },
        { name: JobName.AssetGenerateThumbnailsQueueAll, data: { force: false } },
        { name: JobName.FacialRecognitionQueueAll, data: { force: false, nightly: true } },
      ]);
    });

    it('should skip database cleanup when disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          ...defaults.nightlyTasks,
          databaseCleanup: false,
        },
      });

      await sut.handleNightlyJobs();

      const call = mocks.job.queueAll.mock.calls[0][0];
      expect(call).not.toContainEqual({ name: JobName.AssetDeleteCheck });
      expect(call).not.toContainEqual({ name: JobName.UserDeleteCheck });
      expect(call).not.toContainEqual({ name: JobName.PersonCleanup });
      expect(call).not.toContainEqual({ name: JobName.SessionCleanup });
    });

    it('should skip memory generation when disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          ...defaults.nightlyTasks,
          generateMemories: false,
        },
      });

      await sut.handleNightlyJobs();

      const call = mocks.job.queueAll.mock.calls[0][0];
      expect(call).not.toContainEqual({ name: JobName.MemoryGenerate });
    });

    it('should skip quota sync when disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          ...defaults.nightlyTasks,
          syncQuotaUsage: false,
        },
      });

      await sut.handleNightlyJobs();

      const call = mocks.job.queueAll.mock.calls[0][0];
      expect(call).not.toContainEqual({ name: JobName.UserSyncUsage });
    });

    it('should skip missing thumbnails when disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          ...defaults.nightlyTasks,
          missingThumbnails: false,
        },
      });

      await sut.handleNightlyJobs();

      const call = mocks.job.queueAll.mock.calls[0][0];
      expect(call).not.toContainEqual({ name: JobName.AssetGenerateThumbnailsQueueAll, data: { force: false } });
    });

    it('should skip clustering new faces when disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          ...defaults.nightlyTasks,
          clusterNewFaces: false,
        },
      });

      await sut.handleNightlyJobs();

      const call = mocks.job.queueAll.mock.calls[0][0];
      expect(call).not.toContainEqual({ name: JobName.FacialRecognitionQueueAll, data: { force: false, nightly: true } });
    });

    it('should queue empty array when all nightly tasks are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        nightlyTasks: {
          startTime: '00:00',
          databaseCleanup: false,
          generateMemories: false,
          syncQuotaUsage: false,
          missingThumbnails: false,
          clusterNewFaces: false,
        },
      });

      await sut.handleNightlyJobs();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });
  });

  describe('getAllJobStatus', () => {
    it('should get all job statuses', async () => {
      const stats = factory.queueStatistics({ active: 1 });
      const expected = { jobCounts: stats, queueStatus: { isActive: true, isPaused: true } };

      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(true);

      await expect(sut.getAllLegacy(factory.auth())).resolves.toEqual({
        [QueueName.BackgroundTask]: expected,
        [QueueName.DuplicateDetection]: expected,
        [QueueName.SmartSearch]: expected,
        [QueueName.MetadataExtraction]: expected,
        [QueueName.Search]: expected,
        [QueueName.StorageTemplateMigration]: expected,
        [QueueName.Migration]: expected,
        [QueueName.ThumbnailGeneration]: expected,
        [QueueName.VideoConversion]: expected,
        [QueueName.FaceDetection]: expected,
        [QueueName.FacialRecognition]: expected,
        [QueueName.Sidecar]: expected,
        [QueueName.Library]: expected,
        [QueueName.Notification]: expected,
        [QueueName.BackupDatabase]: expected,
        [QueueName.Ocr]: expected,
        [QueueName.Workflow]: expected,
        [QueueName.Editor]: expected,
      });
    });

    it('should show isActive false when no active jobs', async () => {
      const stats = factory.queueStatistics({ active: 0 });
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      const result = await sut.getAllLegacy(factory.auth());

      for (const queueName of Object.values(QueueName)) {
        expect(result[queueName].queueStatus.isActive).toBe(false);
        expect(result[queueName].queueStatus.isPaused).toBe(false);
      }
    });
  });

  describe('handleCommand', () => {
    it('should handle a pause command', async () => {
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.MetadataExtraction, { command: QueueCommand.Pause, force: false });

      expect(mocks.job.pause).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should handle a resume command', async () => {
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.MetadataExtraction, { command: QueueCommand.Resume, force: false });

      expect(mocks.job.resume).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should handle an empty command', async () => {
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.MetadataExtraction, { command: QueueCommand.Empty, force: false });

      expect(mocks.job.empty).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should handle a clear failed command', async () => {
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());
      mocks.job.clear.mockResolvedValue([]);

      await sut.runCommandLegacy(QueueName.MetadataExtraction, { command: QueueCommand.ClearFailed, force: false });

      expect(mocks.job.clear).toHaveBeenCalledWith(QueueName.MetadataExtraction, QueueCleanType.Failed);
    });

    it('should not start a job that is already running', async () => {
      mocks.job.isActive.mockResolvedValue(true);

      await expect(
        sut.runCommandLegacy(QueueName.VideoConversion, { command: QueueCommand.Start, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should handle a start video conversion command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.VideoConversion, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetEncodeVideoQueueAll, data: { force: false } });
    });

    it('should handle a start storage template migration command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.StorageTemplateMigration, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.StorageTemplateMigration });
    });

    it('should handle a start smart search command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.SmartSearch, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SmartSearchQueueAll, data: { force: false } });
    });

    it('should handle a start metadata extraction command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.MetadataExtraction, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetExtractMetadataQueueAll,
        data: { force: false },
      });
    });

    it('should handle a start sidecar command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.Sidecar, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SidecarQueueAll, data: { force: false } });
    });

    it('should handle a start thumbnail generation command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.ThumbnailGeneration, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetGenerateThumbnailsQueueAll,
        data: { force: false },
      });
    });

    it('should handle a start face detection command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.FaceDetection, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetDetectFacesQueueAll, data: { force: false } });
    });

    it('should handle a start facial recognition command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.FacialRecognition, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.FacialRecognitionQueueAll, data: { force: false } });
    });

    it('should handle a start backup database command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.BackupDatabase, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.DatabaseBackup, data: { force: false } });
    });

    it('should handle a start migration command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.Migration, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.FileMigrationQueueAll });
    });

    it('should handle a start duplicate detection command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.DuplicateDetection, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetDetectDuplicatesQueueAll,
        data: { force: false },
      });
    });

    it('should handle a start library command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.Library, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.LibraryScanQueueAll, data: { force: false } });
    });

    it('should handle a start OCR command', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.Ocr, { command: QueueCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.OcrQueueAll, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      mocks.job.isActive.mockResolvedValue(false);

      await expect(
        sut.runCommandLegacy(QueueName.BackgroundTask, { command: QueueCommand.Start, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should emit QueueStart event on start', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.VideoConversion, { command: QueueCommand.Start, force: false });

      expect(mocks.event.emit).toHaveBeenCalledWith('QueueStart', { name: QueueName.VideoConversion });
    });

    it('should start with force flag', async () => {
      mocks.job.isActive.mockResolvedValue(false);
      mocks.job.getJobCounts.mockResolvedValue(factory.queueStatistics());

      await sut.runCommandLegacy(QueueName.VideoConversion, { command: QueueCommand.Start, force: true });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetEncodeVideoQueueAll, data: { force: true } });
    });

    it('should return queue status after command', async () => {
      const stats = factory.queueStatistics({ active: 2 });
      mocks.job.getJobCounts.mockResolvedValue(stats);
      mocks.job.isPaused.mockResolvedValue(false);

      const result = await sut.runCommandLegacy(QueueName.MetadataExtraction, {
        command: QueueCommand.Pause,
        force: false,
      });

      expect(result).toEqual({
        jobCounts: stats,
        queueStatus: {
          isActive: true,
          isPaused: false,
        },
      });
    });
  });
});
