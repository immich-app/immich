import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import { ImmichWorker } from 'src/enum';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository, JobCommand, JobItem, JobName, JobStatus, QueueName } from 'src/interfaces/job.interface';
import { JobService } from 'src/services/job.service';
import { IConfigRepository, ILoggingRepository } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
import { ITelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(JobService.name, () => {
  let sut: JobService;
  let assetMock: Mocked<IAssetRepository>;
  let configMock: Mocked<IConfigRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggingRepository>;
  let telemetryMock: ITelemetryRepositoryMock;

  beforeEach(() => {
    ({ sut, assetMock, configMock, jobMock, loggerMock, telemetryMock } = newTestService(JobService, {}));

    configMock.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigUpdate', () => {
    it('should update concurrency', () => {
      sut.onConfigUpdate({ newConfig: defaults, oldConfig: {} as SystemConfig });

      expect(jobMock.setConcurrency).toHaveBeenCalledTimes(15);
      expect(jobMock.setConcurrency).toHaveBeenNthCalledWith(5, QueueName.FACIAL_RECOGNITION, 1);
      expect(jobMock.setConcurrency).toHaveBeenNthCalledWith(7, QueueName.DUPLICATE_DETECTION, 1);
      expect(jobMock.setConcurrency).toHaveBeenNthCalledWith(8, QueueName.BACKGROUND_TASK, 5);
      expect(jobMock.setConcurrency).toHaveBeenNthCalledWith(9, QueueName.STORAGE_TEMPLATE_MIGRATION, 1);
    });
  });

  describe('handleNightlyJobs', () => {
    it('should run the scheduled jobs', async () => {
      await sut.handleNightlyJobs();

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION_CHECK },
        { name: JobName.USER_DELETE_CHECK },
        { name: JobName.PERSON_CLEANUP },
        { name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } },
        { name: JobName.CLEAN_OLD_AUDIT_LOGS },
        { name: JobName.USER_SYNC_USAGE },
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false, nightly: true } },
        { name: JobName.CLEAN_OLD_SESSION_TOKENS },
      ]);
    });
  });

  describe('getAllJobStatus', () => {
    it('should get all job statuses', async () => {
      jobMock.getJobCounts.mockResolvedValue({
        active: 1,
        completed: 1,
        failed: 1,
        delayed: 1,
        waiting: 1,
        paused: 1,
      });
      jobMock.getQueueStatus.mockResolvedValue({
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
        [QueueName.BACKGROUND_TASK]: expectedJobStatus,
        [QueueName.DUPLICATE_DETECTION]: expectedJobStatus,
        [QueueName.SMART_SEARCH]: expectedJobStatus,
        [QueueName.METADATA_EXTRACTION]: expectedJobStatus,
        [QueueName.SEARCH]: expectedJobStatus,
        [QueueName.STORAGE_TEMPLATE_MIGRATION]: expectedJobStatus,
        [QueueName.MIGRATION]: expectedJobStatus,
        [QueueName.THUMBNAIL_GENERATION]: expectedJobStatus,
        [QueueName.VIDEO_CONVERSION]: expectedJobStatus,
        [QueueName.FACE_DETECTION]: expectedJobStatus,
        [QueueName.FACIAL_RECOGNITION]: expectedJobStatus,
        [QueueName.SIDECAR]: expectedJobStatus,
        [QueueName.LIBRARY]: expectedJobStatus,
        [QueueName.NOTIFICATION]: expectedJobStatus,
        [QueueName.BACKUP_DATABASE]: expectedJobStatus,
      });
    });
  });

  describe('handleCommand', () => {
    it('should handle a pause command', async () => {
      await sut.handleCommand(QueueName.METADATA_EXTRACTION, { command: JobCommand.PAUSE, force: false });

      expect(jobMock.pause).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
    });

    it('should handle a resume command', async () => {
      await sut.handleCommand(QueueName.METADATA_EXTRACTION, { command: JobCommand.RESUME, force: false });

      expect(jobMock.resume).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
    });

    it('should handle an empty command', async () => {
      await sut.handleCommand(QueueName.METADATA_EXTRACTION, { command: JobCommand.EMPTY, force: false });

      expect(jobMock.empty).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION);
    });

    it('should not start a job that is already running', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: true, isPaused: false });

      await expect(
        sut.handleCommand(QueueName.VIDEO_CONVERSION, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should handle a start video conversion command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.VIDEO_CONVERSION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force: false } });
    });

    it('should handle a start storage template migration command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.STORAGE_TEMPLATE_MIGRATION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.STORAGE_TEMPLATE_MIGRATION });
    });

    it('should handle a start smart search command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.SMART_SEARCH, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_SMART_SEARCH, data: { force: false } });
    });

    it('should handle a start metadata extraction command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.METADATA_EXTRACTION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force: false } });
    });

    it('should handle a start sidecar command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.SIDECAR, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_SIDECAR, data: { force: false } });
    });

    it('should handle a start thumbnail generation command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.THUMBNAIL_GENERATION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
    });

    it('should handle a start face detection command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.FACE_DETECTION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_FACE_DETECTION, data: { force: false } });
    });

    it('should handle a start facial recognition command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.FACIAL_RECOGNITION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await expect(
        sut.handleCommand(QueueName.BACKGROUND_TASK, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('onJobStart', () => {
    it('should process a successful job', async () => {
      jobMock.run.mockResolvedValue(JobStatus.SUCCESS);

      await sut.onJobStart(QueueName.BACKGROUND_TASK, {
        name: JobName.DELETE_FILES,
        data: { files: ['path/to/file'] },
      });

      expect(telemetryMock.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.background_task.active', 1);
      expect(telemetryMock.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.background_task.active', -1);
      expect(telemetryMock.jobs.addToCounter).toHaveBeenCalledWith('immich.jobs.delete_files.success', 1);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    const tests: Array<{ item: JobItem; jobs: JobName[] }> = [
      {
        item: { name: JobName.SIDECAR_SYNC, data: { id: 'asset-1' } },
        jobs: [JobName.METADATA_EXTRACTION],
      },
      {
        item: { name: JobName.SIDECAR_DISCOVERY, data: { id: 'asset-1' } },
        jobs: [JobName.METADATA_EXTRACTION],
      },
      {
        item: { name: JobName.METADATA_EXTRACTION, data: { id: 'asset-1' } },
        jobs: [JobName.LINK_LIVE_PHOTOS],
      },
      {
        item: { name: JobName.LINK_LIVE_PHOTOS, data: { id: 'asset-1' } },
        jobs: [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE],
      },
      {
        item: { name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.GENERATE_THUMBNAILS],
      },
      {
        item: { name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GENERATE_THUMBNAILS, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GENERATE_THUMBNAILS, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SMART_SEARCH, JobName.FACE_DETECTION, JobName.VIDEO_CONVERSION],
      },
      {
        item: { name: JobName.GENERATE_THUMBNAILS, data: { id: 'asset-live-image', source: 'upload' } },
        jobs: [JobName.SMART_SEARCH, JobName.FACE_DETECTION, JobName.VIDEO_CONVERSION],
      },
      {
        item: { name: JobName.SMART_SEARCH, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.FACE_DETECTION, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.FACIAL_RECOGNITION, data: { id: 'asset-1' } },
        jobs: [],
      },
    ];

    for (const { item, jobs } of tests) {
      it(`should queue ${jobs.length} jobs when a ${item.name} job finishes successfully`, async () => {
        if (item.name === JobName.GENERATE_THUMBNAILS && item.data.source === 'upload') {
          if (item.data.id === 'asset-live-image') {
            assetMock.getByIdsWithAllRelations.mockResolvedValue([assetStub.livePhotoStillAsset]);
          } else {
            assetMock.getByIdsWithAllRelations.mockResolvedValue([assetStub.livePhotoMotionAsset]);
          }
        }

        jobMock.run.mockResolvedValue(JobStatus.SUCCESS);

        await sut.onJobStart(QueueName.BACKGROUND_TASK, item);

        if (jobs.length > 1) {
          expect(jobMock.queueAll).toHaveBeenCalledWith(
            jobs.map((jobName) => ({ name: jobName, data: expect.anything() })),
          );
        } else {
          expect(jobMock.queue).toHaveBeenCalledTimes(jobs.length);
          for (const jobName of jobs) {
            expect(jobMock.queue).toHaveBeenCalledWith({ name: jobName, data: expect.anything() });
          }
        }
      });

      it(`should not queue any jobs when ${item.name} fails`, async () => {
        jobMock.run.mockResolvedValue(JobStatus.FAILED);

        await sut.onJobStart(QueueName.BACKGROUND_TASK, item);

        expect(jobMock.queueAll).not.toHaveBeenCalled();
      });
    }
  });
});
