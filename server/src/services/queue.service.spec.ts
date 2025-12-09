import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import { ImmichWorker, JobName, QueueCommand, QueueName } from 'src/enum';
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

  describe('onConfigUpdate', () => {
    it('should update concurrency', () => {
      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.job.setConcurrency).toHaveBeenCalledTimes(17);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(5, QueueName.FacialRecognition, 1);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(7, QueueName.DuplicateDetection, 1);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(8, QueueName.BackgroundTask, 5);
      expect(mocks.job.setConcurrency).toHaveBeenNthCalledWith(9, QueueName.StorageTemplateMigration, 1);
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
      });
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

    it('should throw a bad request when an invalid queue is used', async () => {
      mocks.job.isActive.mockResolvedValue(false);

      await expect(
        sut.runCommandLegacy(QueueName.BackgroundTask, { command: QueueCommand.Start, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });
  });
});
