import { JobName, JobStatus, QueueName } from 'src/enum';
import { TelemetryService } from 'src/services/telemetry.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(TelemetryService.name, () => {
  let sut: TelemetryService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TelemetryService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should set the user gauge to the current user count', async () => {
      mocks.user.getCount.mockResolvedValue(10);

      await sut.onBootstrap();

      expect(mocks.user.getCount).toHaveBeenCalledOnce();
      expect(mocks.telemetry.api.addToGauge).toHaveBeenCalledWith('immich.users.total', 10);
    });

    it('should set the user gauge to zero when there are no users', async () => {
      mocks.user.getCount.mockResolvedValue(0);

      await sut.onBootstrap();

      expect(mocks.telemetry.api.addToGauge).toHaveBeenCalledWith('immich.users.total', 0);
    });
  });

  describe('onUserCreate', () => {
    it('should increment the user gauge by 1', () => {
      sut.onUserCreate();

      expect(mocks.telemetry.api.addToGauge).toHaveBeenCalledWith('immich.users.total', 1);
    });
  });

  describe('onUserTrash', () => {
    it('should decrement the user gauge by 1', () => {
      sut.onUserTrash();

      expect(mocks.telemetry.api.addToGauge).toHaveBeenCalledWith('immich.users.total', -1);
    });
  });

  describe('onUserRestore', () => {
    it('should increment the user gauge by 1', () => {
      sut.onUserRestore();

      expect(mocks.telemetry.api.addToGauge).toHaveBeenCalledWith('immich.users.total', 1);
    });
  });

  describe('onJobStart', () => {
    it('should increment the queue active gauge for thumbnailGeneration', () => {
      sut.onJobStart(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith(
        'immich.queues.thumbnail_generation.active',
        1,
      );
    });

    it('should increment the queue active gauge for metadataExtraction', () => {
      sut.onJobStart(QueueName.MetadataExtraction, {
        name: JobName.AssetExtractMetadata,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith(
        'immich.queues.metadata_extraction.active',
        1,
      );
    });

    it('should increment the queue active gauge for videoConversion', () => {
      sut.onJobStart(QueueName.VideoConversion, {
        name: JobName.AssetEncodeVideo,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.video_conversion.active', 1);
    });

    it('should increment the queue active gauge for backgroundTask', () => {
      sut.onJobStart(QueueName.BackgroundTask, {
        name: JobName.AssetDeleteCheck,
        data: { force: false },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.background_task.active', 1);
    });
  });

  describe('onJobSuccess', () => {
    it('should increment the success counter for a job', () => {
      sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        response: JobStatus.Success,
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith(
        'immich.jobs.asset_generate_thumbnails.success',
        1,
      );
    });

    it('should increment the skipped counter for a skipped job', () => {
      sut.onJobSuccess({
        job: { name: JobName.SmartSearch, data: { id: 'asset-1' } },
        response: JobStatus.Skipped,
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.jobs.smart_search.skipped', 1);
    });

    it('should increment the failed counter for a job that returned failed status', () => {
      sut.onJobSuccess({
        job: { name: JobName.AssetExtractMetadata, data: { id: 'asset-1' } },
        response: JobStatus.Failed,
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith(
        'immich.jobs.asset_extract_metadata.failed',
        1,
      );
    });

    it('should not increment any counter when response is undefined', () => {
      sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        response: undefined,
      });

      expect(mocks.telemetry.jobs.addToCounter).not.toHaveBeenCalled();
    });

    it('should not increment any counter when response is not a valid JobStatus', () => {
      sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        response: 'invalid-status' as any,
      });

      expect(mocks.telemetry.jobs.addToCounter).not.toHaveBeenCalled();
    });
  });

  describe('onJobError', () => {
    it('should increment the failed counter for the job', () => {
      sut.onJobError({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        error: new Error('test error'),
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith(
        'immich.jobs.asset_generate_thumbnails.failed',
        1,
      );
    });

    it('should increment the failed counter for a video encoding job', () => {
      sut.onJobError({
        job: { name: JobName.AssetEncodeVideo, data: { id: 'asset-1' } },
        error: new Error('encoding failed'),
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.jobs.asset_encode_video.failed', 1);
    });

    it('should increment the failed counter for a facial recognition job', () => {
      sut.onJobError({
        job: { name: JobName.FacialRecognition, data: { id: 'person-1' } },
        error: new Error('recognition failed'),
      });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.jobs.facial_recognition.failed', 1);
    });
  });

  describe('onJobComplete', () => {
    it('should decrement the queue active gauge for thumbnailGeneration', () => {
      sut.onJobComplete(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith(
        'immich.queues.thumbnail_generation.active',
        -1,
      );
    });

    it('should decrement the queue active gauge for metadataExtraction', () => {
      sut.onJobComplete(QueueName.MetadataExtraction, {
        name: JobName.AssetExtractMetadata,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith(
        'immich.queues.metadata_extraction.active',
        -1,
      );
    });

    it('should decrement the queue active gauge for smartSearch', () => {
      sut.onJobComplete(QueueName.SmartSearch, {
        name: JobName.SmartSearch,
        data: { id: 'asset-1' },
      });

      expect(mocks.telemetry.jobs.addToGauge).toHaveBeenCalledWith('immich.queues.smart_search.active', -1);
    });
  });

  describe('onQueueStart', () => {
    it('should increment the queue started counter', () => {
      sut.onQueueStart({ name: QueueName.ThumbnailGeneration });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith(
        'immich.queues.thumbnail_generation.started',
        1,
      );
    });

    it('should increment the queue started counter for videoConversion', () => {
      sut.onQueueStart({ name: QueueName.VideoConversion });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.queues.video_conversion.started', 1);
    });

    it('should increment the queue started counter for facialRecognition', () => {
      sut.onQueueStart({ name: QueueName.FacialRecognition });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith(
        'immich.queues.facial_recognition.started',
        1,
      );
    });

    it('should increment the queue started counter for migration', () => {
      sut.onQueueStart({ name: QueueName.Migration });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.queues.migration.started', 1);
    });

    it('should increment the queue started counter for search', () => {
      sut.onQueueStart({ name: QueueName.Search });

      expect(mocks.telemetry.jobs.addToCounter).toHaveBeenCalledWith('immich.queues.search.started', 1);
    });
  });
});
