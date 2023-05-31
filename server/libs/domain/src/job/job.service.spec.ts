import { BadRequestException } from '@nestjs/common';
import {
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
  newSystemConfigRepositoryMock,
} from '../../test';
import { IAssetRepository } from '../asset';
import { ICommunicationRepository } from '../communication';
import { IJobRepository, JobCommand, JobHandler, JobName, JobService, QueueName } from '../job';
import { ISystemConfigRepository } from '../system-config';

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
      const mock = jest.fn();
      const handlers = Object.values(JobName).reduce((map, jobName) => ({ ...map, [jobName]: mock }), {}) as Record<
        JobName,
        JobHandler
      >;

      await sut.registerHandlers(handlers);

      expect(configMock.load).toHaveBeenCalled();
      expect(jobMock.addHandler).toHaveBeenCalledTimes(Object.keys(QueueName).length);
    });
  });
});
