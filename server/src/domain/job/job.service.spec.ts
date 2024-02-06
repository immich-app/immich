import { SystemConfig, SystemConfigKey } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import {
  assetStub,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
  newPersonRepositoryMock,
  newSystemConfigRepositoryMock,
} from '@test';
import {
  IAssetRepository,
  ICommunicationRepository,
  IJobRepository,
  IPersonRepository,
  ISystemConfigRepository,
  JobHandler,
  JobItem,
} from '../repositories';
import { FeatureFlag, SystemConfigCore } from '../system-config/system-config.core';
import { JobCommand, JobName, QueueName } from './job.constants';
import { JobService } from './job.service';

const makeMockHandlers = (success: boolean) => {
  const mock = jest.fn().mockResolvedValue(success);
  return Object.fromEntries(Object.values(JobName).map((jobName) => [jobName, mock])) as unknown as Record<
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
  let personMock: jest.Mocked<IPersonRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    jobMock = newJobRepositoryMock();
    personMock = newPersonRepositoryMock();
    sut = new JobService(assetMock, communicationMock, jobMock, configMock, personMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
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
        { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
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

  describe('init', () => {
    it('should register a handler for each queue', async () => {
      await sut.init(makeMockHandlers(true));
      expect(configMock.load).toHaveBeenCalled();
      expect(jobMock.addHandler).toHaveBeenCalledTimes(Object.keys(QueueName).length);
    });

    it('should subscribe to config changes', async () => {
      await sut.init(makeMockHandlers(false));

      SystemConfigCore.create(newSystemConfigRepositoryMock(false)).config$.next({
        job: {
          [QueueName.BACKGROUND_TASK]: { concurrency: 10 },
          [QueueName.SMART_SEARCH]: { concurrency: 10 },
          [QueueName.METADATA_EXTRACTION]: { concurrency: 10 },
          [QueueName.FACE_DETECTION]: { concurrency: 10 },
          [QueueName.SEARCH]: { concurrency: 10 },
          [QueueName.SIDECAR]: { concurrency: 10 },
          [QueueName.LIBRARY]: { concurrency: 10 },
          [QueueName.MIGRATION]: { concurrency: 10 },
          [QueueName.THUMBNAIL_GENERATION]: { concurrency: 10 },
          [QueueName.VIDEO_CONVERSION]: { concurrency: 10 },
        },
      } as SystemConfig);

      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.BACKGROUND_TASK, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.SMART_SEARCH, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.METADATA_EXTRACTION, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.FACE_DETECTION, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.SIDECAR, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.LIBRARY, 10);
      expect(jobMock.setConcurrency).toHaveBeenCalledWith(QueueName.MIGRATION, 10);
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
        jobs: [JobName.LINK_LIVE_PHOTOS],
      },
      {
        item: { name: JobName.LINK_LIVE_PHOTOS, data: { id: 'asset-1' } },
        jobs: [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE],
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
        item: { name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: 'asset-1' } },
        jobs: [
          JobName.GENERATE_WEBP_THUMBNAIL,
          JobName.GENERATE_THUMBHASH_THUMBNAIL,
          JobName.SMART_SEARCH,
          JobName.FACE_DETECTION,
        ],
      },
      {
        item: { name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: 'asset-1', source: 'upload' } },
        jobs: [
          JobName.GENERATE_WEBP_THUMBNAIL,
          JobName.GENERATE_THUMBHASH_THUMBNAIL,
          JobName.SMART_SEARCH,
          JobName.FACE_DETECTION,
          JobName.VIDEO_CONVERSION,
        ],
      },
      {
        item: { name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: 'asset-live-image', source: 'upload' } },
        jobs: [
          JobName.GENERATE_WEBP_THUMBNAIL,
          JobName.GENERATE_THUMBHASH_THUMBNAIL,
          JobName.SMART_SEARCH,
          JobName.FACE_DETECTION,
          JobName.VIDEO_CONVERSION,
        ],
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
        if (item.name === JobName.GENERATE_JPEG_THUMBNAIL && item.data.source === 'upload') {
          if (item.data.id === 'asset-live-image') {
            assetMock.getByIds.mockResolvedValue([assetStub.livePhotoStillAsset]);
          } else {
            assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);
          }
        } else {
          assetMock.getByIds.mockResolvedValue([]);
        }

        await sut.init(makeMockHandlers(true));
        await jobMock.addHandler.mock.calls[0][2](item);

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

      it(`should not queue any jobs when ${item.name} finishes with 'false'`, async () => {
        await sut.init(makeMockHandlers(false));
        await jobMock.addHandler.mock.calls[0][2](item);

        expect(jobMock.queueAll).not.toHaveBeenCalled();
      });
    }

    const featureTests: Array<{ queue: QueueName; feature: FeatureFlag; configKey: SystemConfigKey }> = [
      {
        queue: QueueName.SMART_SEARCH,
        feature: FeatureFlag.SMART_SEARCH,
        configKey: SystemConfigKey.MACHINE_LEARNING_CLIP_ENABLED,
      },
      {
        queue: QueueName.FACE_DETECTION,
        feature: FeatureFlag.FACIAL_RECOGNITION,
        configKey: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_ENABLED,
      },
      {
        queue: QueueName.FACIAL_RECOGNITION,
        feature: FeatureFlag.FACIAL_RECOGNITION,
        configKey: SystemConfigKey.MACHINE_LEARNING_FACIAL_RECOGNITION_ENABLED,
      },
    ];

    for (const { queue, feature, configKey } of featureTests) {
      it(`should throw an error if attempting to queue ${queue} when ${feature} is disabled`, async () => {
        configMock.load.mockResolvedValue([{ key: configKey, value: false }]);
        jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

        await expect(sut.handleCommand(queue, { command: JobCommand.START, force: false })).rejects.toThrow();
      });
    }
  });
});
