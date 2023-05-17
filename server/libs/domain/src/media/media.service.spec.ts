import { AssetType, SystemConfigKey } from '@app/infra/entities';
import _ from 'lodash';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newCommunicationRepositoryMock,
  newJobRepositoryMock,
  newMediaRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  probeStub,
} from '../../test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { ICommunicationRepository } from '../communication';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IMediaRepository } from './media.repository';
import { MediaService } from './media.service';

describe(MediaService.name, () => {
  let sut: MediaService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    jobMock = newJobRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new MediaService(assetMock, communicationMock, jobMock, mediaMock, storageMock, configMock);
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
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.image) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.resize).toHaveBeenCalledWith('/original/path.ext', 'upload/thumbs/user-id/asset-id.jpeg', {
        size: 1440,
        format: 'jpeg',
      });
      expect(mediaMock.extractThumbnailFromExif).not.toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/thumbs/user-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for an image from exif', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      mediaMock.resize.mockRejectedValue(new Error('unsupported format'));

      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.image) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.resize).toHaveBeenCalledWith('/original/path.ext', 'upload/thumbs/user-id/asset-id.jpeg', {
        size: 1440,
        format: 'jpeg',
      });
      expect(mediaMock.extractThumbnailFromExif).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/asset-id.jpeg',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/thumbs/user-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for a video', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleGenerateJpegThumbnail({ asset: _.cloneDeep(assetEntityStub.video) });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.extractVideoThumbnail).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/thumbs/user-id/asset-id.jpeg',
        1440,
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/thumbs/user-id/asset-id.jpeg',
      });
    });

    it('should queue some jobs', async () => {
      const asset = _.cloneDeep(assetEntityStub.image);
      assetMock.getByIds.mockResolvedValue([asset]);
      await sut.handleGenerateJpegThumbnail({ asset });

      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.CLASSIFY_IMAGE, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.DETECT_OBJECTS, data: { asset } });
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.ENCODE_CLIP, data: { asset } });
    });

    it('should log an error', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
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

  describe('handleQueueVideoConversion', () => {
    it('should queue all video assets', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.video]);

      await sut.handleQueueVideoConversion({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith({ type: AssetType.VIDEO });
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { asset: assetEntityStub.video },
      });
    });

    it('should queue all video assets without encoded videos', async () => {
      assetMock.getWithout.mockResolvedValue([assetEntityStub.video]);

      await sut.handleQueueVideoConversion({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith(WithoutProperty.ENCODED_VIDEO);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { asset: assetEntityStub.video },
      });
    });

    it('should log an error', async () => {
      assetMock.getAll.mockRejectedValue(new Error('database unavailable'));

      await sut.handleQueueVideoConversion({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
    });
  });

  describe('handleVideoConversion', () => {
    beforeEach(() => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
    });

    it('should log an error', async () => {
      mediaMock.transcode.mockRejectedValue(new Error('unable to transcode'));

      await sut.handleVideoConversion({ asset: assetEntityStub.video });

      expect(storageMock.mkdirSync).toHaveBeenCalled();
    });

    it('should transcode the longest stream', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ asset: assetEntityStub.video });

      expect(mediaMock.probe).toHaveBeenCalledWith('/original/path.ext');
      expect(configMock.load).toHaveBeenCalled();
      expect(storageMock.mkdirSync).toHaveBeenCalled();
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart'],
      );
    });

    it('should skip a video without any streams', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noHeight);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should transcode when set to all', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'all' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart'],
      );
    });

    it('should transcode when optimal and too big', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart', '-vf scale=-2:720'],
      );
    });

    it('should transcode with alternate scaling video is vertical', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart', '-vf scale=720:-2'],
      );
    });

    it('should transcode when audio doesnt match target', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.audioStreamMp3);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart', '-vf scale=-2:720'],
      );
    });

    it('should transcode when container doesnt match target', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        ['-crf 23', '-preset ultrafast', '-vcodec h264', '-acodec aac', '-movflags faststart', '-vf scale=-2:720'],
      );
    });

    it('should not transcode an invalid transcode value', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'invalid' }]);
      await sut.handleVideoConversion({ asset: assetEntityStub.video });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });
  });
});
