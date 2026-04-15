import { defaults, SystemConfig } from 'src/config';
import { ImmichWorker, JobName, QueueName } from 'src/enum';
import { QueueService } from 'src/services/queue.service';
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

      expect(mocks.job.setConcurrency).toHaveBeenCalledTimes(18);
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
});
