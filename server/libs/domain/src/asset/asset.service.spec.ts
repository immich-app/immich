import { AssetEntity, AssetType } from '@app/infra/entities';
import { assetEntityStub, authStub, newAssetRepositoryMock, newJobRepositoryMock } from '../../test';
import { AssetService, IAssetRepository } from '../asset';
import { IJobRepository, JobName } from '../job';

describe(AssetService.name, () => {
  let sut: AssetService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    sut = new AssetService(assetMock, jobMock);
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

  describe('save', () => {
    it('should save an asset', async () => {
      assetMock.save.mockResolvedValue(assetEntityStub.image);

      await sut.save(assetEntityStub.image);

      expect(assetMock.save).toHaveBeenCalledWith(assetEntityStub.image);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SEARCH_INDEX_ASSET,
        data: { ids: [assetEntityStub.image.id] },
      });
    });
  });

  describe('get map markers', () => {
    it('should get geo information of assets', async () => {
      assetMock.getMapMarkers.mockResolvedValue(
        [assetEntityStub.withLocation].map((asset) => ({
          id: asset.id,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lat: asset.exifInfo!.latitude!,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lon: asset.exifInfo!.longitude!,
        })),
      );

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual({
        id: assetEntityStub.withLocation.id,
        lat: 100,
        lon: 100,
      });
    });
  });
});
