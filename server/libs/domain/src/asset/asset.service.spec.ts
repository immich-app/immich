import { AssetEntity, AssetType } from '@app/infra/db/entities';
import { newJobRepositoryMock } from '../../test';
import { AssetService } from '../asset';
import { IJobRepository, JobName } from '../job';

describe(AssetService.name, () => {
  let sut: AssetService;
  let jobMock: jest.Mocked<IJobRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    jobMock = newJobRepositoryMock();
    sut = new AssetService(jobMock);
  });

  describe(`handle asset upload`, () => {
    it('should process an uploaded video', async () => {
      const data = { asset: { type: AssetType.VIDEO } as AssetEntity, fileName: 'video.mp4' };

      await expect(sut.handleAssetUpload(data)).resolves.toBeUndefined();

      expect(jobMock.queue).toHaveBeenCalledTimes(3);
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data }],
        [{ name: JobName.VIDEO_CONVERSION, data }],
        [{ name: JobName.EXTRACT_VIDEO_METADATA, data }],
      ]);
    });

    it('should process an uploaded image', async () => {
      const data = { asset: { type: AssetType.IMAGE } as AssetEntity, fileName: 'image.jpg' };

      await sut.handleAssetUpload(data);

      expect(jobMock.queue).toHaveBeenCalledTimes(2);
      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.GENERATE_JPEG_THUMBNAIL, data }],
        [{ name: JobName.EXIF_EXTRACTION, data }],
      ]);
    });
  });
});
