import { AssetEntity, AssetType } from '@app/infra/db/entities';
import { newJobRepositoryMock } from '../../test';
import { IAssetUploadedJob } from './interfaces';
import { JobName } from './job.constants';
import { IJobRepository, Job } from './job.repository';
import { JobService } from './job.service';

const jobStub = {
  upload: {
    video: Object.freeze<Job<IAssetUploadedJob>>({
      data: { asset: { type: AssetType.VIDEO } as AssetEntity, fileName: 'video.mp4' },
    }),
    image: Object.freeze<Job<IAssetUploadedJob>>({
      data: { asset: { type: AssetType.IMAGE } as AssetEntity, fileName: 'image.jpg' },
    }),
  },
};

describe(JobService.name, () => {
  let sut: JobService;
  let jobMock: jest.Mocked<IJobRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    jobMock = newJobRepositoryMock();
    sut = new JobService(jobMock);
  });

  describe('handleUploadedAsset', () => {
    it('should process a video', async () => {
      await expect(sut.handleUploadedAsset(jobStub.upload.video)).resolves.toBeUndefined();

      expect(jobMock.add).toHaveBeenCalledTimes(3);
      expect(jobMock.add.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset: { type: AssetType.VIDEO } } }],
        [{ name: JobName.VIDEO_CONVERSION, data: { asset: { type: AssetType.VIDEO } } }],
        [{ name: JobName.EXTRACT_VIDEO_METADATA, data: { asset: { type: AssetType.VIDEO }, fileName: 'video.mp4' } }],
      ]);
    });

    it('should process an image', async () => {
      await sut.handleUploadedAsset(jobStub.upload.image);

      expect(jobMock.add).toHaveBeenCalledTimes(2);
      expect(jobMock.add.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset: { type: AssetType.IMAGE } } }],
        [{ name: JobName.EXIF_EXTRACTION, data: { asset: { type: AssetType.IMAGE }, fileName: 'image.jpg' } }],
      ]);
    });
  });
});
