import { ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { JobService } from 'src/services/job.service';
import { JobItem } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
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
        stub: [assetStub.image],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1' } },
        jobs: [],
        stub: [assetStub.video],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SmartSearch, JobName.AssetDetectFaces, JobName.Ocr],
        stub: [assetStub.livePhotoStillAsset],
      },
      {
        item: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-1', source: 'upload' } },
        jobs: [JobName.SmartSearch, JobName.AssetDetectFaces, JobName.Ocr, JobName.AssetEncodeVideo],
        stub: [assetStub.video],
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
});
