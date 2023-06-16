import { AssetType, SystemConfigKey } from '@app/infra/entities';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newJobRepositoryMock,
  newMediaRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  probeStub,
} from '@test';
import { IAssetRepository, WithoutProperty } from '../asset';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IMediaRepository } from './media.repository';
import { MediaService } from './media.service';

describe(MediaService.name, () => {
  let sut: MediaService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let mediaMock: jest.Mocked<IMediaRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    jobMock = newJobRepositoryMock();
    mediaMock = newMediaRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new MediaService(assetMock, jobMock, mediaMock, storageMock, configMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueGenerateThumbnails', () => {
    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { id: assetEntityStub.image.id },
      });
    });

    it('should queue all assets with missing thumbnails', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { id: assetEntityStub.image.id },
      });
    });
  });

  describe('handleGenerateJpegThumbnail', () => {
    it('should generate a thumbnail for an image', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleGenerateJpegThumbnail({ id: assetEntityStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.resize).toHaveBeenCalledWith('/original/path.ext', 'upload/thumbs/user-id/asset-id.jpeg', {
        size: 1440,
        format: 'jpeg',
      });
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/thumbs/user-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for a video', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleGenerateJpegThumbnail({ id: assetEntityStub.video.id });

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

    it('should run successfully', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleGenerateJpegThumbnail({ id: assetEntityStub.image.id });
    });
  });

  describe('handleGenerateWebpThumbnail', () => {
    it('should skip thumbnail generate if resize path is missing', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.noResizePath]);
      await sut.handleGenerateWepbThumbnail({ id: assetEntityStub.noResizePath.id });
      expect(mediaMock.resize).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      await sut.handleGenerateWepbThumbnail({ id: assetEntityStub.image.id });

      expect(mediaMock.resize).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.ext',
        '/uploads/user-id/thumbs/path.ext',
        { format: 'webp', size: 250 },
      );
      expect(assetMock.save).toHaveBeenCalledWith({ id: 'asset-id', webpPath: '/uploads/user-id/thumbs/path.ext' });
    });
  });

  describe('handleQueueVideoConversion', () => {
    it('should queue all video assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.video],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { type: AssetType.VIDEO });
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { id: assetEntityStub.video.id },
      });
    });

    it('should queue all video assets without encoded videos', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetEntityStub.video],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.ENCODED_VIDEO);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { id: assetEntityStub.video.id },
      });
    });
  });

  describe('handleVideoConversion', () => {
    beforeEach(() => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
    });

    it('should transcode the longest stream', async () => {
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ id: assetEntityStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith('/original/path.ext');
      expect(configMock.load).toHaveBeenCalled();
      expect(storageMock.mkdirSync).toHaveBeenCalled();
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: ['-vcodec h264', '-acodec aac', '-movflags faststart', '-preset ultrafast', '-crf 23'],
          twoPass: false,
        },
      );
    });

    it('should skip a video without any streams', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noHeight);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should transcode when set to all', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'all' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: ['-vcodec h264', '-acodec aac', '-movflags faststart', '-preset ultrafast', '-crf 23'],
          twoPass: false,
        },
      );
    });

    it('should transcode when optimal and too big', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should not scale resolution if no target resolution', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'all' },
        { key: SystemConfigKey.FFMPEG_TARGET_RESOLUTION, value: 'original' },
      ]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: ['-vcodec h264', '-acodec aac', '-movflags faststart', '-preset ultrafast', '-crf 23'],
          twoPass: false,
        },
      );
    });

    it('should transcode with alternate scaling video is vertical', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=720:-2',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode when audio doesnt match target', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.audioStreamMp3);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode when container doesnt match target', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'optimal' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should not transcode an invalid transcode value', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: 'invalid' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set max bitrate if above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_MAX_BITRATE, value: '4500k' }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
            '-maxrate 4500k',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode in two passes for h264/h265 when enabled and max bitrate is above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_MAX_BITRATE, value: '4500k' },
        { key: SystemConfigKey.FFMPEG_TWO_PASS, value: true },
      ]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-b:v 3104k',
            '-minrate 1552k',
            '-maxrate 4500k',
          ],
          twoPass: true,
        },
      );
    });

    it('should fallback to one pass for h264/h265 if two-pass is enabled but no max bitrate is set', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TWO_PASS, value: true }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should configure preset for vp9', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: 'vp9' },
        { key: SystemConfigKey.FFMPEG_THREADS, value: 2 },
      ]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-cpu-used 5',
            '-row-mt 1',
            '-threads 2',
            '-crf 23',
            '-b:v 0',
          ],
          twoPass: false,
        },
      );
    });

    it('should configure threads if above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: 'vp9' },
        { key: SystemConfigKey.FFMPEG_THREADS, value: 2 },
      ]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-cpu-used 5',
            '-row-mt 1',
            '-threads 2',
            '-crf 23',
            '-b:v 0',
          ],
          twoPass: false,
        },
      );
    });

    it('should disable thread pooling for x264/x265 if thread limit is above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_THREADS, value: 2 }]);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.video]);
      await sut.handleVideoConversion({ id: assetEntityStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-threads 2',
            '-x264-params "pools=none"',
            '-x264-params "frame-threads=2"',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });
  });
});
