import { constants } from 'fs/promises';
import { assetEntityStub, newAssetRepositoryMock, newJobRepositoryMock, newStorageRepositoryMock } from '../../test';
import { IAssetRepository, WithoutProperty, WithProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { MetadataService } from './metadata.service';

describe(MetadataService.name, () => {
  let sut: MetadataService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new MetadataService(assetMock, jobMock, storageMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueSidecar', () => {
    it('should queue assets with sidecar files', async () => {
      assetMock.getWith.mockResolvedValue({ items: [assetEntityStub.sidecar], hasNextPage: false });

      await sut.handleQueueSidecar({ force: true });

      expect(assetMock.getWith).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithProperty.SIDECAR);
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SIDECAR_SYNC,
        data: { asset: assetEntityStub.sidecar },
      });
    });

    it('should queue assets without sidecar files', async () => {
      assetMock.getWithout.mockResolvedValue({ items: [assetEntityStub.image], hasNextPage: false });

      await sut.handleQueueSidecar({ force: false });

      expect(assetMock.getWithout).toHaveBeenCalledWith({ take: 1000, skip: 0 }, WithoutProperty.SIDECAR);
      expect(assetMock.getWith).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.SIDECAR_DISCOVERY,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should log an error', async () => {
      assetMock.getWith.mockRejectedValue(new Error('database unavailable'));
      await sut.handleQueueSidecar({ force: true });
      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });

  describe('handleSidecarSync', () => {
    it('should skip hidden assets', async () => {
      await sut.handleSidecarSync({ asset: assetEntityStub.livePhotoMotionAsset });
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should handle video assets', async () => {
      await sut.handleSidecarSync({ asset: assetEntityStub.video });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.EXTRACT_VIDEO_METADATA,
        data: { asset: assetEntityStub.video },
      });
    });

    it('should handle image assets', async () => {
      await sut.handleSidecarSync({ asset: assetEntityStub.image });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.EXIF_EXTRACTION,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should log an error', async () => {
      jobMock.queue.mockRejectedValue(new Error('queue job failed'));
      await sut.handleSidecarSync({ asset: assetEntityStub.image });
    });
  });

  describe('handleSidecarDiscovery', () => {
    it('should skip hidden assets', async () => {
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.livePhotoMotionAsset });
      expect(storageMock.checkFileExists).not.toHaveBeenCalled();
    });

    it('should skip assets with a sidecar path', async () => {
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.sidecar });
      expect(storageMock.checkFileExists).not.toHaveBeenCalled();
    });

    it('should do nothing when a sidecar is not found ', async () => {
      storageMock.checkFileExists.mockResolvedValue(false);
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.image });
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should update a image asset when a sidecar is found', async () => {
      assetMock.save.mockResolvedValue(assetEntityStub.image);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.image });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.ext.xmp', constants.W_OK);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        sidecarPath: '/original/path.ext.xmp',
      });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.EXIF_EXTRACTION,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should update a video asset when a sidecar is found', async () => {
      assetMock.save.mockResolvedValue(assetEntityStub.video);
      storageMock.checkFileExists.mockResolvedValue(true);
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.video });
      expect(storageMock.checkFileExists).toHaveBeenCalledWith('/original/path.ext.xmp', constants.W_OK);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        sidecarPath: '/original/path.ext.xmp',
      });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.EXTRACT_VIDEO_METADATA,
        data: { asset: assetEntityStub.video },
      });
    });

    it('should log an error', async () => {
      storageMock.checkFileExists.mockRejectedValue(new Error('bad permission'));
      await sut.handleSidecarDiscovery({ asset: assetEntityStub.image });
    });
  });
});
