import { AssetType, SystemConfigKey, TranscodePolicy, VideoCodec } from '@app/infra/entities';
import {
  assetStub,
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
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue all assets with missing resize path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noResizePath],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_JPEG_THUMBNAIL,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue all assets with missing webp path', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noWebpPath],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_WEBP_THUMBNAIL,
        data: { id: assetStub.image.id },
      });
    });

    it('should queue all assets with missing thumbhash', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.noThumbhash],
        hasNextPage: false,
      });

      await sut.handleQueueGenerateThumbnails({ force: false });

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.THUMBNAIL);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.GENERATE_THUMBHASH_THUMBNAIL,
        data: { id: assetStub.image.id },
      });
    });
  });

  describe('handleGenerateJpegThumbnail', () => {
    it('should skip thumbnail generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGenerateJpegThumbnail({ id: assetStub.image.id });
      expect(mediaMock.resize).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalledWith();
    });

    it('should generate a thumbnail for an image', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleGenerateJpegThumbnail({ id: assetStub.image.id });

      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs/user-id');
      expect(mediaMock.resize).toHaveBeenCalledWith('/original/path.jpg', 'upload/thumbs/user-id/asset-id.jpeg', {
        size: 1440,
        format: 'jpeg',
      });
      expect(assetMock.save).toHaveBeenCalledWith({
        id: 'asset-id',
        resizePath: 'upload/thumbs/user-id/asset-id.jpeg',
      });
    });

    it('should generate a thumbnail for a video', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleGenerateJpegThumbnail({ id: assetStub.video.id });

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
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleGenerateJpegThumbnail({ id: assetStub.image.id });
    });
  });

  describe('handleGenerateWebpThumbnail', () => {
    it('should skip thumbnail generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGenerateWebpThumbnail({ id: assetStub.image.id });
      expect(mediaMock.resize).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalledWith();
    });

    it('should skip thumbnail generate if resize path is missing', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGenerateWebpThumbnail({ id: assetStub.noResizePath.id });
      expect(mediaMock.resize).not.toHaveBeenCalled();
    });

    it('should generate a thumbnail', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleGenerateWebpThumbnail({ id: assetStub.image.id });

      expect(mediaMock.resize).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.jpg',
        '/uploads/user-id/thumbs/path.webp',
        { format: 'webp', size: 250 },
      );
      expect(assetMock.save).toHaveBeenCalledWith({ id: 'asset-id', webpPath: '/uploads/user-id/thumbs/path.webp' });
    });
  });

  describe('handleGenerateThumbhashThumbnail', () => {
    it('should skip thumbhash generation if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleGenerateThumbhashThumbnail({ id: assetStub.image.id });
      expect(mediaMock.generateThumbhash).not.toHaveBeenCalled();
    });

    it('should skip thumbhash generation if resize path is missing', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);
      await sut.handleGenerateThumbhashThumbnail({ id: assetStub.noResizePath.id });
      expect(mediaMock.generateThumbhash).not.toHaveBeenCalled();
    });

    it('should generate a thumbhash', async () => {
      const thumbhashBuffer = Buffer.from('a thumbhash', 'utf8');
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      mediaMock.generateThumbhash.mockResolvedValue(thumbhashBuffer);

      await sut.handleGenerateThumbhashThumbnail({ id: assetStub.image.id });

      expect(mediaMock.generateThumbhash).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg');
      expect(assetMock.save).toHaveBeenCalledWith({ id: 'asset-id', thumbhash: thumbhashBuffer });
    });
  });

  describe('handleQueueVideoConversion', () => {
    it('should queue all video assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.video],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({ force: true });

      expect(assetMock.getAll).toHaveBeenCalledWith({ skip: 0, take: 1000 }, { type: AssetType.VIDEO });
      expect(assetMock.getWithout).not.toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { id: assetStub.video.id },
      });
    });

    it('should queue all video assets without encoded videos', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.video],
        hasNextPage: false,
      });

      await sut.handleQueueVideoConversion({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.ENCODED_VIDEO);
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: { id: assetStub.video.id },
      });
    });
  });

  describe('handleVideoConversion', () => {
    beforeEach(() => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
    });

    it('should skip transcoding if asset not found', async () => {
      assetMock.getByIds.mockResolvedValue([]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.probe).not.toHaveBeenCalled();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip transcoding if non-video asset', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      await sut.handleVideoConversion({ id: assetStub.image.id });
      expect(mediaMock.probe).not.toHaveBeenCalled();
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should transcode the longest stream', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);

      await sut.handleVideoConversion({ id: assetStub.video.id });

      expect(mediaMock.probe).toHaveBeenCalledWith('/original/path.ext');
      expect(configMock.load).toHaveBeenCalled();
      expect(storageMock.mkdirSync).toHaveBeenCalled();
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should skip a video without any streams', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noVideoStreams);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should skip a video without any height', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.noHeight);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should transcode when set to all', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.multipleVideoStreams);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.ALL }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode when optimal and too big', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.OPTIMAL }]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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
        { key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.ALL },
        { key: SystemConfigKey.FFMPEG_TARGET_RESOLUTION, value: 'original' },
      ]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode with alternate scaling video is vertical', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStreamVertical2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.OPTIMAL }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.OPTIMAL }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.OPTIMAL }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if transcoding is disabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TRANSCODE, value: TranscodePolicy.DISABLED }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should not transcode if target codec is invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.videoStream2160p);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: 'invalid' }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).not.toHaveBeenCalled();
    });

    it('should set max bitrate if above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_MAX_BITRATE, value: '4500k' }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
            '-maxrate 4500k',
            '-bufsize 9000k',
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
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should transcode by bitrate in two passes for vp9 when two pass mode and max bitrate are enabled', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_MAX_BITRATE, value: '4500k' },
        { key: SystemConfigKey.FFMPEG_TWO_PASS, value: true },
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.VP9 },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-cpu-used 5',
            '-row-mt 1',
            '-b:v 3104k',
            '-minrate 1552k',
            '-maxrate 4500k',
          ],
          twoPass: true,
        },
      );
    });

    it('should configure preset for vp9', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.VP9 },
        { key: SystemConfigKey.FFMPEG_PRESET, value: 'slow' },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-cpu-used 2',
            '-row-mt 1',
            '-crf 23',
            '-b:v 0',
          ],
          twoPass: false,
        },
      );
    });

    it('should not configure preset for vp9 if invalid', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.VP9 },
        { key: SystemConfigKey.FFMPEG_PRESET, value: 'invalid' },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-row-mt 1',
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
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.VP9 },
        { key: SystemConfigKey.FFMPEG_THREADS, value: 2 },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec vp9',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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

    it('should disable thread pooling for h264 if thread limit is above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_THREADS, value: 2 }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
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

    it('should omit thread flags for h264 if thread limit is at or below 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.FFMPEG_THREADS, value: 0 }]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec h264',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should disable thread pooling for hevc if thread limit is above 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_THREADS, value: 2 },
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.HEVC },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec hevc',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-threads 2',
            '-x265-params "pools=none"',
            '-x265-params "frame-threads=2"',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });

    it('should omit thread flags for hevc if thread limit is at or below 0', async () => {
      mediaMock.probe.mockResolvedValue(probeStub.matroskaContainer);
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_THREADS, value: 0 },
        { key: SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC, value: VideoCodec.HEVC },
      ]);
      assetMock.getByIds.mockResolvedValue([assetStub.video]);
      await sut.handleVideoConversion({ id: assetStub.video.id });
      expect(mediaMock.transcode).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/encoded-video/user-id/asset-id.mp4',
        {
          inputOptions: [],
          outputOptions: [
            '-vcodec hevc',
            '-acodec aac',
            '-movflags faststart',
            '-fps_mode passthrough',
            '-vf scale=-2:720',
            '-preset ultrafast',
            '-crf 23',
          ],
          twoPass: false,
        },
      );
    });
  });
});
