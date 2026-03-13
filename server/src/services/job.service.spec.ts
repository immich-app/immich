import { BadRequestException } from '@nestjs/common';
import { AssetType, AssetVisibility, ImmichWorker, JobName, JobStatus, ManualJobName, QueueName } from 'src/enum';
import { JobService } from 'src/services/job.service';
import { JobItem } from 'src/types';
import { AssetFactory } from 'test/factories/asset.factory';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(JobService.name, () => {
  let sut: JobService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(JobService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should queue a TagCleanup job', async () => {
      await sut.create({ name: ManualJobName.TagCleanup });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.TagCleanup });
    });

    it('should queue a PersonCleanup job', async () => {
      await sut.create({ name: ManualJobName.PersonCleanup });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.PersonCleanup });
    });

    it('should queue a UserDeleteCheck job', async () => {
      await sut.create({ name: ManualJobName.UserCleanup });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.UserDeleteCheck });
    });

    it('should queue a MemoryCleanup job', async () => {
      await sut.create({ name: ManualJobName.MemoryCleanup });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.MemoryCleanup });
    });

    it('should queue a MemoryGenerate job', async () => {
      await sut.create({ name: ManualJobName.MemoryCreate });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.MemoryGenerate });
    });

    it('should queue a DatabaseBackup job', async () => {
      await sut.create({ name: ManualJobName.BackupDatabase });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.DatabaseBackup });
    });

    it('should throw BadRequestException for an invalid job name', async () => {
      await expect(sut.create({ name: 'invalid-job' as ManualJobName })).rejects.toThrow(BadRequestException);
    });
  });

  describe('onJobRun', () => {
    it('should process a successful job', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);

      const job: JobItem = { name: JobName.FileDelete, data: { files: ['path/to/file'] } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.event.emit).toHaveBeenCalledWith('JobStart', QueueName.BackgroundTask, job);
      expect(mocks.event.emit).toHaveBeenCalledWith('JobSuccess', { job, response: JobStatus.Success });
      expect(mocks.event.emit).toHaveBeenCalledWith('JobComplete', QueueName.BackgroundTask, job);
      expect(mocks.logger.error).not.toHaveBeenCalled();
    });

    it('should emit JobError when the job throws an error', async () => {
      const error = new Error('test error');
      mocks.job.run.mockRejectedValue(error);

      const job: JobItem = { name: JobName.FileDelete, data: { files: ['path/to/file'] } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.event.emit).toHaveBeenCalledWith('JobStart', QueueName.BackgroundTask, job);
      expect(mocks.event.emit).toHaveBeenCalledWith('JobError', { job, error });
      expect(mocks.event.emit).toHaveBeenCalledWith('JobComplete', QueueName.BackgroundTask, job);
    });

    it('should emit JobComplete even when an error occurs', async () => {
      mocks.job.run.mockRejectedValue(new Error('failure'));

      const job: JobItem = { name: JobName.FileDelete, data: { files: ['path/to/file'] } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.event.emit).toHaveBeenCalledWith('JobComplete', QueueName.BackgroundTask, job);
    });

    it('should not call onDone when job returns a non-status response', async () => {
      mocks.job.run.mockResolvedValue(undefined as any);

      const job: JobItem = { name: JobName.SidecarCheck, data: { id: 'asset-1' } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should not call onDone when job returns JobStatus.Failed', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Failed);

      const job: JobItem = { name: JobName.SidecarCheck, data: { id: 'asset-1' } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should call onDone when job returns JobStatus.Skipped', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Skipped);

      const job: JobItem = { name: JobName.SidecarCheck, data: { id: 'asset-1' } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetExtractMetadata, data: { id: 'asset-1' } });
    });

    const tests: Array<{ item: JobItem; jobs: JobName[]; stub?: any }> = [
      {
        item: { name: JobName.SidecarCheck, data: { id: 'asset-1' } },
        jobs: [JobName.AssetExtractMetadata],
      },
      {
        item: { name: JobName.SidecarCheck, data: { id: 'asset-1' } },
        jobs: [JobName.AssetExtractMetadata],
      },
      {
        item: { name: JobName.StorageTemplateMigrationSingle, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.AssetGenerateThumbnails],
      },
      {
        item: { name: JobName.StorageTemplateMigrationSingle, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.PersonGenerateThumbnail, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        jobs: [],
        stub: [AssetFactory.create({ id: 'asset-1' })],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        jobs: [],
        stub: [AssetFactory.create({ id: 'asset-1', type: AssetType.Video })],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SmartSearch, JobName.AssetDetectFaces, JobName.Ocr, JobName.PetDetection],
        stub: [AssetFactory.create({ id: 'asset-1', livePhotoVideoId: newUuid() })],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [
          JobName.SmartSearch,
          JobName.AssetDetectFaces,
          JobName.Ocr,
          JobName.PetDetection,
          JobName.AssetEncodeVideo,
        ],
        stub: [AssetFactory.create({ id: 'asset-1', type: AssetType.Video })],
      },
      {
        item: { name: JobName.SmartSearch, data: { id: 'asset-1' } },
        jobs: [],
      },
      {
        item: { name: JobName.AssetDetectFaces, data: { id: 'asset-1' } },
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

        await sut.onJobRun(QueueName.BackgroundTask, item);

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

        await sut.onJobRun(QueueName.BackgroundTask, item);

        expect(mocks.job.queueAll).not.toHaveBeenCalled();
      });
    }
  });

  describe('onDone - SidecarCheck', () => {
    it('should queue AssetExtractMetadata with the same data', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.Sidecar, { name: JobName.SidecarCheck, data: { id } });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AssetExtractMetadata, data: { id } });
    });
  });

  describe('onDone - SidecarWrite', () => {
    it('should queue AssetExtractMetadata with source sidecar-write', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.Sidecar, { name: JobName.SidecarWrite, data: { id } });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetExtractMetadata,
        data: { id, source: 'sidecar-write' },
      });
    });
  });

  describe('onDone - StorageTemplateMigrationSingle', () => {
    it('should queue AssetGenerateThumbnails when source is upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.StorageTemplateMigration, {
        name: JobName.StorageTemplateMigrationSingle,
        data: { id, source: 'upload' },
      });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });
    });

    it('should queue AssetGenerateThumbnails when source is copy', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.StorageTemplateMigration, {
        name: JobName.StorageTemplateMigrationSingle,
        data: { id, source: 'copy' },
      });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'copy' },
      });
    });

    it('should not queue any job when source is not upload or copy', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.StorageTemplateMigration, {
        name: JobName.StorageTemplateMigrationSingle,
        data: { id },
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should not queue any job when source is sidecar-write', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.StorageTemplateMigration, {
        name: JobName.StorageTemplateMigrationSingle,
        data: { id, source: 'sidecar-write' },
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('onDone - PersonGenerateThumbnail', () => {
    it('should send websocket event when person is found', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const personId = newUuid();
      const ownerId = newUuid();
      const person = factory.person({ id: personId, ownerId });
      mocks.person.getById.mockResolvedValue(person);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.PersonGenerateThumbnail,
        data: { id: personId },
      });

      expect(mocks.person.getById).toHaveBeenCalledWith(personId);
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_person_thumbnail', ownerId, personId);
    });

    it('should not send websocket event when person is not found', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const personId = newUuid();
      mocks.person.getById.mockResolvedValue(undefined as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.PersonGenerateThumbnail,
        data: { id: personId },
      });

      expect(mocks.person.getById).toHaveBeenCalledWith(personId);
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });
  });

  describe('onDone - AssetEditThumbnailGeneration', () => {
    it('should send websocket event with asset and edit info when asset is found', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const assetId = newUuid();
      const ownerId = newUuid();
      const asset = {
        id: assetId,
        ownerId,
        originalFileName: 'IMG_123.jpg',
        thumbhash: null,
        checksum: Buffer.from('abc123'),
        fileCreatedAt: new Date('2024-01-01'),
        fileModifiedAt: new Date('2024-01-02'),
        localDateTime: new Date('2024-01-01'),
        duration: null,
        type: AssetType.Image,
        deletedAt: null,
        isFavorite: false,
        visibility: AssetVisibility.Timeline,
        livePhotoVideoId: null,
        stackId: null,
        libraryId: null,
        width: 1920,
        height: 1080,
        isEdited: true,
      };
      const edits = [{ action: 'rotate', parameters: { angle: 90 } }];

      mocks.asset.getById.mockResolvedValue(asset as any);
      mocks.assetEdit.getWithSyncInfo.mockResolvedValue(edits as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetEditThumbnailGeneration,
        data: { id: assetId },
      });

      expect(mocks.asset.getById).toHaveBeenCalledWith(assetId);
      expect(mocks.assetEdit.getWithSyncInfo).toHaveBeenCalledWith(assetId);
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('AssetEditReadyV1', ownerId, {
        asset: expect.objectContaining({ id: assetId, ownerId }),
        edit: edits,
      });
    });

    it('should handle asset with thumbhash', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const assetId = newUuid();
      const ownerId = newUuid();
      const asset = {
        id: assetId,
        ownerId,
        originalFileName: 'IMG_123.jpg',
        thumbhash: Buffer.from('thumbhash'),
        checksum: Buffer.from('abc123'),
        fileCreatedAt: new Date('2024-01-01'),
        fileModifiedAt: new Date('2024-01-02'),
        localDateTime: new Date('2024-01-01'),
        duration: null,
        type: AssetType.Image,
        deletedAt: null,
        isFavorite: false,
        visibility: AssetVisibility.Timeline,
        livePhotoVideoId: null,
        stackId: null,
        libraryId: null,
        width: 1920,
        height: 1080,
        isEdited: true,
      };
      const edits: any[] = [];

      mocks.asset.getById.mockResolvedValue(asset as any);
      mocks.assetEdit.getWithSyncInfo.mockResolvedValue(edits);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetEditThumbnailGeneration,
        data: { id: assetId },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith(
        'AssetEditReadyV1',
        ownerId,
        expect.objectContaining({
          asset: expect.objectContaining({
            id: assetId,
            thumbhash: expect.any(String),
          }),
        }),
      );
    });

    it('should not send websocket event when asset is not found', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const assetId = newUuid();

      mocks.asset.getById.mockResolvedValue(undefined as any);
      mocks.assetEdit.getWithSyncInfo.mockResolvedValue([]);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetEditThumbnailGeneration,
        data: { id: assetId },
      });

      expect(mocks.asset.getById).toHaveBeenCalledWith(assetId);
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });
  });

  describe('onDone - AssetGenerateThumbnails', () => {
    it('should not queue jobs when notify is false and source is not upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, notify: false },
      });

      expect(mocks.asset.getByIdsWithAllRelationsButStacks).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should proceed when notify is true even without source upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const asset = AssetFactory.create({ id });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, notify: true },
      });

      expect(mocks.asset.getByIdsWithAllRelationsButStacks).toHaveBeenCalledWith([id]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          { name: JobName.SmartSearch, data: expect.anything() },
          { name: JobName.AssetDetectFaces, data: expect.anything() },
          { name: JobName.Ocr, data: expect.anything() },
          { name: JobName.PetDetection, data: expect.anything() },
        ]),
      );
    });

    it('should log warning when asset is not found', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([]);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining(id));
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should queue SmartSearch, AssetDetectFaces, and Ocr for image assets with source upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const asset = AssetFactory.create({ id, type: AssetType.Image });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SmartSearch, data: { id, source: 'upload' } },
        { name: JobName.AssetDetectFaces, data: { id, source: 'upload' } },
        { name: JobName.Ocr, data: { id, source: 'upload' } },
        { name: JobName.PetDetection, data: { id, source: 'upload' } },
      ]);
    });

    it('should additionally queue AssetEncodeVideo for video assets', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const asset = AssetFactory.create({ id, type: AssetType.Video });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SmartSearch, data: { id, source: 'upload' } },
        { name: JobName.AssetDetectFaces, data: { id, source: 'upload' } },
        { name: JobName.Ocr, data: { id, source: 'upload' } },
        { name: JobName.PetDetection, data: { id, source: 'upload' } },
        { name: JobName.AssetEncodeVideo, data: { id, source: 'upload' } },
      ]);
    });

    it('should send on_upload_success websocket event for Timeline visibility assets', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.create({ id, ownerId, visibility: AssetVisibility.Timeline });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_upload_success', ownerId, expect.anything());
    });

    it('should send on_upload_success websocket event for Archive visibility assets', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.create({ id, ownerId, visibility: AssetVisibility.Archive });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_upload_success', ownerId, expect.anything());
    });

    it('should not send websocket events for Hidden visibility assets', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.create({ id, ownerId, visibility: AssetVisibility.Hidden });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should send AssetUploadReadyV1 websocket event when asset has exifInfo', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.from({ id, ownerId, visibility: AssetVisibility.Timeline }).exif().build();
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_upload_success', ownerId, expect.anything());
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('AssetUploadReadyV1', ownerId, {
        asset: expect.objectContaining({ id, ownerId }),
        exif: expect.objectContaining({
          description: expect.any(String),
          exifImageWidth: expect.any(Number),
          exifImageHeight: expect.any(Number),
        }),
      });
    });

    it('should not send AssetUploadReadyV1 when asset has no exifInfo', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.create({ id, ownerId, visibility: AssetVisibility.Timeline });
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_upload_success', ownerId, expect.anything());
      expect(mocks.websocket.clientSend).not.toHaveBeenCalledWith(
        'AssetUploadReadyV1',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should handle asset with thumbhash in AssetUploadReadyV1 event', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.from({
        id,
        ownerId,
        visibility: AssetVisibility.Timeline,
        thumbhash: Buffer.from('thumbhash'),
      })
        .exif()
        .build();
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith(
        'AssetUploadReadyV1',
        ownerId,
        expect.objectContaining({
          asset: expect.objectContaining({
            id,
            thumbhash: expect.any(String),
          }),
        }),
      );
    });

    it('should handle asset with null thumbhash in AssetUploadReadyV1 event', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();
      const ownerId = newUuid();
      const asset = AssetFactory.from({
        id,
        ownerId,
        visibility: AssetVisibility.Timeline,
        thumbhash: null,
      })
        .exif()
        .build();
      mocks.asset.getByIdsWithAllRelationsButStacks.mockResolvedValue([asset] as any);

      await sut.onJobRun(QueueName.ThumbnailGeneration, {
        name: JobName.AssetGenerateThumbnails,
        data: { id, source: 'upload' },
      });

      expect(mocks.websocket.clientSend).toHaveBeenCalledWith(
        'AssetUploadReadyV1',
        ownerId,
        expect.objectContaining({
          asset: expect.objectContaining({
            id,
            thumbhash: null,
          }),
        }),
      );
    });
  });

  describe('onDone - SmartSearch', () => {
    it('should queue AssetDetectDuplicates when source is upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.SmartSearch, {
        name: JobName.SmartSearch,
        data: { id, source: 'upload' },
      });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetDetectDuplicates,
        data: { id, source: 'upload' },
      });
    });

    it('should not queue AssetDetectDuplicates when source is not upload', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.SmartSearch, {
        name: JobName.SmartSearch,
        data: { id },
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should not queue AssetDetectDuplicates when source is sidecar-write', async () => {
      mocks.job.run.mockResolvedValue(JobStatus.Success);
      const id = newUuid();

      await sut.onJobRun(QueueName.SmartSearch, {
        name: JobName.SmartSearch,
        data: { id, source: 'sidecar-write' },
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('onJobRun - error handling', () => {
    it('should not emit JobSuccess when job throws', async () => {
      mocks.job.run.mockRejectedValue(new Error('job failed'));

      const job: JobItem = { name: JobName.FileDelete, data: { files: ['path/to/file'] } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.event.emit).not.toHaveBeenCalledWith('JobSuccess', expect.anything());
    });

    it('should not call onDone when job throws', async () => {
      mocks.job.run.mockRejectedValue(new Error('job failed'));

      const job: JobItem = { name: JobName.SidecarCheck, data: { id: 'asset-1' } };
      await sut.onJobRun(QueueName.Sidecar, job);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should handle error when eventRepository.emit for JobStart throws', async () => {
      mocks.event.emit.mockRejectedValueOnce(new Error('emit failed'));

      const job: JobItem = { name: JobName.FileDelete, data: { files: ['path/to/file'] } };
      await sut.onJobRun(QueueName.BackgroundTask, job);

      expect(mocks.event.emit).toHaveBeenCalledWith('JobError', {
        job,
        error: expect.any(Error),
      });
    });
  });
});
