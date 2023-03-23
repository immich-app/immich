import _ from 'lodash';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
  newMediaRepositoryMock,
  newStorageRepositoryMock,
} from '../../test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { ICommunicationRepository } from '../communication';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { IMediaRepository } from './media.repository';
import { MediaService } from './media.service';

describe(MediaService.name, () => {
  let sut: MediaService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    jobMock = newJobRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    storageMock = newStorageRepositoryMock();
    sut = new MediaService(assetMock, communicationMock, jobMock, mediaMock, storageMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueGenerateThumbnails', () => {
    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should queue all assets with missing thumbnails', async () => {
      assetMock.getWithout.mockResolvedValue([assetEntityStub.image]);

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith(WithoutProperty.THUMBNAIL);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { asset: assetEntityStub.image },
      });
    });

    it('should log an error', async () => {
      assetMock.getAll.mockRejectedValue(new Error('database unavailable'));

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
    });
  });

  describe('handleGenerateJpegThumbnail', () => {
    it('should generate a thumbnail for an image', async () => {
      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.image) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/user-id/thumb/device-id');
      expect(mediaMock.resize).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/thumb/device-id/asset-id.jpeg',
        { size: 1440, format: 'jpeg' },
      );
      expect(mediaMock.extractThumbnailFromExif).not.toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/user-id/thumb/device-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for an image from exif', async () => {
      mediaMock.resize.mockRejectedValue(new Error('unsupported format'));

      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.image) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/user-id/thumb/device-id');
      expect(mediaMock.resize).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/thumb/device-id/asset-id.jpeg',
        { size: 1440, format: 'jpeg' },
      );
      expect(mediaMock.extractThumbnailFromExif).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/thumb/device-id/asset-id.jpeg',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/user-id/thumb/device-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for a video', async () => {
      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.video) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/user-id/thumb/device-id');
      expect(mediaMock.extractVideoThumbnail).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/thumb/device-id/asset-id.jpeg',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/user-id/thumb/device-id/asset-id.jpeg',
      });
    });

    it('should queue some jobs', async () => {
      const asset = _.cloneDeep(assetEntityStub.image);

      await sut.handleGenerateJpegThumbnail({ asset });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.CLASSIFY_IMAGE, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.DETECT_OBJECTS, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { asset } });
    });

    it('should log an error', async () => {
      mediaMock.resize.mockRejectedValue(new Error('unsupported format'));
      mediaMock.extractThumbnailFromExif.mockRejectedValue(new Error('unsupported format'));

      await sut.handleGenerateJpegThumbnail({ asset: assetEntityStub.image });

      expect(assetMock.save).not.toHaveBeenCalled();
    });
  });

  describe('handleGenerateWebpThumbnail', () => {
    it('should skip thumbnail generate if resize path is missing', async () => {
      await sut.handleGenerateWepbThumbnail({ asset: assetEntityStub.noResizePath });

      expect(mediaMock.resize).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      await sut.handleGenerateWepbThumbnail({ asset: assetEntityStub.image });

      expect(mediaMock.resize).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.ext',
        '/uploads/user-id/thumbs/path.ext',
        { format: 'webp', size: 250 },
      );
      expect(assetMock.save).toHaveBeenCalledWith({ id: 'asset-id', webpPath: '/uploads/user-id/thumbs/path.ext' });
    });

    it('should log an error', async () => {
      mediaMock.resize.mockRejectedValue(new Error('service unavailable'));

      await sut.handleGenerateWepbThumbnail({ asset: assetEntityStub.image });

      expect(mediaMock.resize).toHaveBeenCalled();
    });
  });
});
