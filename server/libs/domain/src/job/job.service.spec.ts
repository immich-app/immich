import { BadRequestException } from '@nestjs/common';
import { newJobRepositoryMock } from '../../test';
import { IJobRepository, JobCommand, JobName, JobService } from '../job';

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
        // upload
        'asset-uploaded': expectedJobStatus,

        // conversion
        'queue-video-conversion': expectedJobStatus,
        'video-conversion': expectedJobStatus,

        // thumbnails
        'queue-generate-thumbnails': expectedJobStatus,
        'generate-jpeg-thumbnail': expectedJobStatus,
        'generate-webp-thumbnail': expectedJobStatus,

        // metadata
        'queue-metadata-extraction': expectedJobStatus,
        'exif-extraction': expectedJobStatus,
        'extract-video-metadata': expectedJobStatus,

        // user deletion
        'queue-user-delete': expectedJobStatus,
        'user-delete': expectedJobStatus,

        // storage template
        'storage-template-migration': expectedJobStatus,
        'storage-template-migration-single': expectedJobStatus,
        'system-config-change': expectedJobStatus,

        // object tagging
        'queue-object-tagging': expectedJobStatus,
        'detect-objects': expectedJobStatus,
        'classify-image': expectedJobStatus,

        // cleanup
        'delete-files': expectedJobStatus,

        // search
        'search-index-assets': expectedJobStatus,
        'search-index-asset': expectedJobStatus,
        'search-index-albums': expectedJobStatus,
        'search-index-album': expectedJobStatus,
        'search-remove-album': expectedJobStatus,
        'search-remove-asset': expectedJobStatus,

        // clip
        'queue-clip-encode': expectedJobStatus,
        'clip-encode': expectedJobStatus,
      });
    });
  });

  describe('handleCommand', () => {
    it('should handle a pause command', async () => {
      await sut.handleCommand(JobName.QUEUE_METADATA_EXTRACTION, { command: JobCommand.PAUSE, force: false });

      expect(jobMock.pause).toHaveBeenCalledWith(JobName.QUEUE_METADATA_EXTRACTION);
    });

    it('should handle a resume command', async () => {
      await sut.handleCommand(JobName.QUEUE_METADATA_EXTRACTION, { command: JobCommand.RESUME, force: false });

      expect(jobMock.resume).toHaveBeenCalledWith(JobName.QUEUE_METADATA_EXTRACTION);
    });

    it('should handle an empty command', async () => {
      await sut.handleCommand(JobName.QUEUE_METADATA_EXTRACTION, { command: JobCommand.EMPTY, force: false });

      expect(jobMock.empty).toHaveBeenCalledWith(JobName.QUEUE_METADATA_EXTRACTION);
    });

    it('should not start a job that is already running', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: true, isPaused: false });

      await expect(
        sut.handleCommand(JobName.VIDEO_CONVERSION, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should handle a start video conversion command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.QUEUE_VIDEO_CONVERSION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force: false } });
    });

    it('should handle a start storage template migration command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.STORAGE_TEMPLATE_MIGRATION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.STORAGE_TEMPLATE_MIGRATION });
    });

    it('should handle a start object tagging command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.QUEUE_OBJECT_TAGGING, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force: false } });
    });

    it('should handle a start clip encoding command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.QUEUE_ENCODE_CLIP, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_ENCODE_CLIP, data: { force: false } });
    });

    it('should handle a start metadata extraction command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.QUEUE_METADATA_EXTRACTION, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force: false } });
    });

    it('should handle a start thumbnail generation command', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.handleCommand(JobName.QUEUE_GENERATE_THUMBNAILS, { command: JobCommand.START, force: false });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
    });

    it('should throw a bad request when an invalid queue is used', async () => {
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await expect(
        sut.handleCommand(JobName.SEARCH_INDEX_ASSET, { command: JobCommand.START, force: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
