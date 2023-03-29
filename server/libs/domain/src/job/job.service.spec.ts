import { BadRequestException } from '@nestjs/common';
import { newJobRepositoryMock } from '../../test';
import { IJobRepository, JobCommand, JobName, JobService, QueueName } from '../job';

describe(JobService.name, () => {
  let sut: JobService;
  let jobMock: jest.Mocked<IJobRepository>;

  beforeEach(async () => {
    jobMock = newJobRepositoryMock();
    sut = new JobService(jobMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
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

      await expect(sut.getAllJobsStatus()).resolves.toEqual({
        'background-task-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'clip-encoding-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'metadata-extraction-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'object-tagging-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'search-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'storage-template-migration-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'thumbnail-generation-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
        'video-conversion-queue': {
          active: 1,
          completed: 1,
          delayed: 1,
          failed: 1,
          waiting: 1,
          paused: 1,
        },
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
      jobMock.isActive.mockResolvedValue(true);

      await expect(
        sut.handleCommand(QueueName.VIDEO_CONVERSION, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should handle a start video conversion command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.VIDEO_CONVERSION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force: false } });
    });

    it('should handle a start storage template migration command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.STORAGE_TEMPLATE_MIGRATION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.STORAGE_TEMPLATE_MIGRATION });
    });

    it('should handle a start object tagging command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.OBJECT_TAGGING, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force: false } });
    });

    it('should handle a start clip encoding command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.CLIP_ENCODING, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_ENCODE_CLIP, data: { force: false } });
    });

    it('should handle a start metadata extraction command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.METADATA_EXTRACTION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force: false } });
    });

    it('should handle a start thumbnail generation command', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await sut.handleCommand(QueueName.THUMBNAIL_GENERATION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      jobMock.isActive.mockResolvedValue(false);

      await expect(
        sut.handleCommand(QueueName.BACKGROUND_TASK, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
