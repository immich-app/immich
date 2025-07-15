import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import { ImmichWorker, JobCommand, JobName, JobStatus, QueueName } from 'src/enum';
import { JobService } from 'src/services/job.service';
import { JobItem } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(JobService.name, () => {
  let sut: JobService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(JobService, {}));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigUpdate', () => {
    it('should update concurrency', () => {
      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(mocks.job.setConcurrency).toHaveBeenCalledTimes(15);
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
        { name: JobName.AssetDeletionCheck },
        { name: JobName.UserDeleteCheck },
        { name: JobName.PersonCleanup },
        { name: JobName.MemoriesCleanup },
        { name: JobName.CleanOldSessionTokens },
        { name: JobName.CleanOldAuditLogs },
        { name: JobName.MemoriesCreate },
        { name: JobName.userSyncUsage },
        { name: JobName.QueueGenerateThumbnails, data: { force: false } },
        { name: JobName.QueueFacialRecognition, data: { force: false, nightly: true } },
      ]);
    });
  });

  describe('getAllJobStatus', () => {
    it('should get all job statuses', async () => {
      mocks.job.getJobCounts.mockResolvedValue({
        active: 1,
        completed: 1,
        failed: 1,
        delayed: 1,
        waiting: 1,
        paused: 1,
      });
      mocks.job.getQueueStatus.mockResolvedValue({
        isActive: true,
        isPaused: true,
      });

      const expectedJobStatus = {
        jobCounts: {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        queueStatus: {
          isActive: true,
          isPaused: true,
        },
      };

      await expect(sut.getAllJobsStatus()).resolves.toEqual({
        [QueueName.BackgroundTask]: expectedJobStatus,
        [QueueName.DuplicateDetection]: expectedJobStatus,
        [QueueName.SmartSearch]: expectedJobStatus,
        [QueueName.MetadataExtraction]: expectedJobStatus,
        [QueueName.Search]: expectedJobStatus,
        [QueueName.StorageTemplateMigration]: expectedJobStatus,
        [QueueName.Migration]: expectedJobStatus,
        [QueueName.ThumbnailGeneration]: expectedJobStatus,
        [QueueName.VideoConversion]: expectedJobStatus,
        [QueueName.FaceDetection]: expectedJobStatus,
        [QueueName.FacialRecognition]: expectedJobStatus,
        [QueueName.Sidecar]: expectedJobStatus,
        [QueueName.Library]: expectedJobStatus,
        [QueueName.Notification]: expectedJobStatus,
        [QueueName.BackupDatabase]: expectedJobStatus,
      });
    });
  });

  describe('handleCommand', () => {
    it('should handle a pause command', async () => {
      await sut.handleCommand(QueueName.MetadataExtraction, { command: JobCommand.Pause, force: false });

      expect(mocks.job.pause).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should handle a resume command', async () => {
      await sut.handleCommand(QueueName.MetadataExtraction, { command: JobCommand.Resume, force: false });

      expect(mocks.job.resume).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should handle an empty command', async () => {
      await sut.handleCommand(QueueName.MetadataExtraction, { command: JobCommand.Empty, force: false });

      expect(mocks.job.empty).toHaveBeenCalledWith(QueueName.MetadataExtraction);
    });

    it('should not start a job that is already running', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: true, isPaused: false });

      await expect(
        sut.handleCommand(QueueName.VideoConversion, { command: JobCommand.Start, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should handle a start video conversion command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.VideoConversion, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueVideoConversion, data: { force: false } });
    });

    it('should handle a start storage template migration command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.StorageTemplateMigration, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.StorageTemplateMigration });
    });

    it('should handle a start smart search command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.SmartSearch, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueSmartSearch, data: { force: false } });
    });

    it('should handle a start metadata extraction command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.MetadataExtraction, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueMetadataExtraction, data: { force: false } });
    });

    it('should handle a start sidecar command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.Sidecar, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueSidecar, data: { force: false } });
    });

    it('should handle a start thumbnail generation command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.ThumbnailGeneration, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueGenerateThumbnails, data: { force: false } });
    });

    it('should handle a start face detection command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.FaceDetection, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueFaceDetection, data: { force: false } });
    });

    it('should handle a start facial recognition command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.FacialRecognition, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.QueueFacialRecognition, data: { force: false } });
    });

    it('should handle a start backup database command', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.BackupDatabase, { command: JobCommand.Start, force: false });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.BackupDatabase, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      mocks.job.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await expect(
        sut.handleCommand(QueueName.BackgroundTask, { command: JobCommand.Start, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('onJobStart', () => {
    it('should process a successful job', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);

      await sut.onJobStart(QueueName.BackgroundTask, {
        name: JobName.DeleteFiles,
        data: { files: ['path/to/file'] },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.background_task.active', 1);
      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.background_task.active', -1);
      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.jobs.delete_files.success', 1);
      expect(mocks.logger.error).not.toHaveBeenCalled();
    });

    const tests: Array<{ item: JobItem; jobs: JobName[]; stub?: any }> = [
      {
        item: { name: JobName.SidecarSync, data: { id: 'asset-1' } },
        jobs: [JobName.MetadataExtraction],
      },
      {
        item: { name: JobName.SidecarDiscovery, data: { id: 'asset-1' } },
        jobs: [JobName.MetadataExtraction],
      },
      {
        item: { name: JobName.StorageTemplateMigrationSingle, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.GenerateThumbnails],
      },
      {
        item: { name: JobName.StorageTemplateMigrationSingle, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GeneratePersonThumbnail, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GenerateThumbnails, data: { id: 'asset-1' } },
        jobs: [],
        stub: [assetStub.image],
      },
      {
        item: { name: JobName.GenerateThumbnails, data: { id: 'asset-1' } },
        jobs: [],
        stub: [assetStub.video],
      },
      {
        item: { name: JobName.GenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SmartSearch, JobName.FaceDetection],
        stub: [assetStub.livePhotoStillAsset],
      },
      {
        item: { name: JobName.GenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SmartSearch, JobName.FaceDetection, JobName.VideoConversation],
        stub: [assetStub.video],
      },
      {
        item: { name: JobName.SmartSearch, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.FaceDetection, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.FacialRecognition, data: { id: 'asset-1' } },
        jobs: [],
      },
    ];

    for (const { item, jobs, stub } of tests) {
      it(`should queue ${jobs.length} jobs when a ${item.name} job finishes successfully`, async () => {
        if (stub) {
          mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue(stub);
        }

        mocks.job.run.mockResolvedValue(JobStatus.Success);

        await sut.onJobStart(QueueName.BackgroundTask, item);

        if (jobs.length > 1) {
          expect(mocks.job.queueAll).toHaveBeenCalledWith(
            jobs.map((jobName) => ({ name: jobName, data: expect.anything() })),
          );
        } else {
          expect(mocks.job.queue).toHaveBeenCalledTimes(jobs.length);
          for (const jobName of jobs) {
            expect(mocks.job.queue).toHaveBeenCalledWith({ name: jobName, data: expect.anything() });
          }
        }
      });

      it(`should not queue any jobs when ${item.name} fails`, async () => {
        mocks.job.run.mockResolvedValue(JobStatus.Failed);

        await sut.onJobStart(QueueName.BackgroundTask, item);

        expect(mocks.job.queueAll).not.toHaveBeenCalled();
      });
    }
  });
});
