import { SystemConfig } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import {
  asyncTick,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
  newSystemConfigRepositoryMock,
} from '@test';
import { IJobRepository, JobCommand, JobHandler, JobItem, JobName, JobService, QueueName } from '.';
import { IAssetRepository } from '../asset';
import { ICommunicationRepository } from '../communication';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';

const makeMockHandlers = (success: boolean) => {
  const mock = jest.fn().mockResolvedValue(success);
  return Object.values(JobName).reduce((map, jobName) => ({ ...map, [jobName]: mock }), {}) as Record<
    JobName,
    JobHandler
  >;
};

describe(JobService.name, () => {
  let sut: JobService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    jobMock = newJobRepositoryMock();
    sut = new JobService(assetMock, communicationMock, jobMock, configMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleNightlyJobs', () => {
    it('should run the scheduled jobs', async () => {
      await sut.handleNightlyJobs();

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.USER_DELETE_CHECK }],
        [{ name: JobName.PERSON_CLEANUP }],
        [{ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } }],
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
        [QueueName.CLIP_ENCODING]: expectedJobStatus,
        [QueueName.METADATA_EXTRACTION]: expectedJobStatus,
        [QueueName.OBJECT_TAGGING]: expectedJobStatus,
        [QueueName.SEARCH]: expectedJobStatus,
        [QueueName.STORAGE_TEMPLATE_MIGRATION]: expectedJobStatus,
        [QueueName.THUMBNAIL_GENERATION]: expectedJobStatus,
        [QueueName.VIDEO_CONVERSION]: expectedJobStatus,
        [QueueName.RECOGNIZE_FACES]: expectedJobStatus,
        [QueueName.SIDECAR]: expectedJobStatus,
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

    it('should handle a start object tagging command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.OBJECT_TAGGING, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force: false } });
    });

    it('should handle a start clip encoding command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.CLIP_ENCODING, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_ENCODE_CLIP, data: { force: false } });
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

    it('should handle a start recognize faces command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(QueueName.RECOGNIZE_FACES, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_RECOGNIZE_FACES, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await expect(
        sut.handleCommand(QueueName.BACKGROUND_TASK, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });

  describe('registerHandlers', () => {
    it('should register a handler for each queue', async () => {
      await sut.registerHandlers(makeMockHandlers(true));
      expect(configMock.load).toHaveBeenCalled();
      expect(jobMock.addHandler).toHaveBeenCalledTimes(Object.keys(QueueName).length);
    });

    it('should subscribe to config changes', async () => {
      await sut.registerHandlers(makeMockHandlers(false));

      const configCore = new SystemConfigCore(newSystemConfigRepositoryMock());
      configCore.config$.next({
        job: {
          [QueueName.BACKGROUND_TASK]: { concurrency: 10 },
          [QueueName.CLIP_ENCODING]: { concurrency: 10 },
          [QueueName.METADATA_EXTRACTION]: { concurrency: 10 },
          [QueueName.OBJECT_TAGGING]: { concurrency: 10 },
          [QueueName.RECOGNIZE_FACES]: { concurrency: 10 },
          [QueueName.SEARCH]: { concurrency: 10 },
          [QueueName.SIDECAR]: { concurrency: 10 },
          [QueueName.STORAGE_TEMPLATE_MIGRATION]: { concurrency: 10 },
          [QueueName.THUMBNAIL_GENERATION]: { concurrency: 10 },
          [QueueName.VIDEO_CONVERSION]: { concurrency: 10 },
        },
      } as SystemConfig);

      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.BACKGROUND_TASK, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.CLIP_ENCODING, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.OBJECT_TAGGING, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.RECOGNIZE_FACES, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.SIDECAR, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.STORAGE_TEMPLATE_MIGRATION, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.THUMBNAIL_GENERATION, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.VIDEO_CONVERSION, 10);
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
        jobs: [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, JobName.SEARCH_INDEX_ASSET],
      },
      {
        item: { name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.GENERATE_JPEG_THUMBNAIL],
      },
      {
        item: { name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: 'asset-1' } },
        jobs: [JobName.GENERATE_WEBP_THUMBNAIL, JobName.CLASSIFY_IMAGE, JobName.ENCODE_CLIP, JobName.RECOGNIZE_FACES],
      },
      {
        item: { name: JobName.CLASSIFY_IMAGE, data: { id: 'asset-1' } },
        jobs: [JobName.SEARCH_INDEX_ASSET],
      },
      {
        item: { name: JobName.ENCODE_CLIP, data: { id: 'asset-1' } },
        jobs: [JobName.SEARCH_INDEX_ASSET],
      },
      {
        item: { name: JobName.RECOGNIZE_FACES, data: { id: 'asset-1' } },
        jobs: [JobName.SEARCH_INDEX_ASSET],
      },
    ];

    for (const { item, jobs } of tests) {
      it(`should queue ${jobs.length} jobs when a ${item.name} job finishes successfully`, async () => {
        assetMock.getByIds.mockResolvedValue([]);

        await sut.registerHandlers(makeMockHandlers(true));
        await jobMock.addHandler.mock.calls[0][2](item);
        await asyncTick(3);

        expect(jobMock.queue).toHaveBeenCalledTimes(jobs.length);
        for (const jobName of jobs) {
          expect(jobMock.queue).toHaveBeenCalledWith({ name: jobName, data: expect.anything() });
        }
      });

      it(`should not queue any jobs when ${item.name} finishes with 'false'`, async () => {
        await sut.registerHandlers(makeMockHandlers(false));
        await jobMock.addHandler.mock.calls[0][2](item);
        await asyncTick(3);

        expect(jobMock.queue).not.toHaveBeenCalled();
      });
    }
  });
});
